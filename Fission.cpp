#include <xtensor/xview.hpp>
#include "Fission.h"

namespace Fission {
  void Evaluation::compute(const Settings &settings) {
    cooling += 1.0 / std::max(0.01, settings.temperature);
    double moderatorsFE = moderatorCellMultiplier * settings.modFEMult / 100.0;
    double moderatorsHeat = moderatorCellMultiplier * settings.modHeatMult / 100.0;
    if (settings.altCalc) {
      heat = settings.fuelBaseHeat * (cellsHeatMult + moderatorsHeat);
      power = settings.fuelBasePower * (cellsEnergyMult + moderatorsFE);
    } else {
      moderatorsFE *= settings.fuelBasePower;
      moderatorsHeat *= settings.fuelBaseHeat;
      heat = settings.fuelBaseHeat * std::max(breed, fuelCellMultiplier) + moderatorsHeat;
      power = settings.fuelBasePower * abs(fuelCellMultiplier - breed) + moderatorsFE;
    }
    power = trunc(power * heatMultiplier(heat, cooling, settings.heatMult, settings.altCalc) * settings.FEGenMult / 10.0 * settings.genMult);
    netHeat = heat - cooling;
    dutyCycle = std::min(1.0, cooling / heat);
    avgPower = power * dutyCycle;
    avgBreed = breed * dutyCycle;
    double mult = fuelCellMultiplier > breed ? 1.0 * fuelCellMultiplier / breed : breed; // Silly double cast
    efficiency = breed ? power / (settings.fuelBasePower * mult) : 1.0;
  }

  double Evaluation::heatMultiplier(double heatPerTick, double coolingPerTick, double heatMult, bool altCalc) {
    if (heatPerTick == 0.0) {
      return 0.0;
    }
    double c = std::max(1.0, coolingPerTick);
    double heatMultiplier = std::log10(heatPerTick / c) / (1 + std::exp(heatPerTick / c * heatMult)) + 1;
    if (altCalc) {
      return round(heatMultiplier * 100) / 100;
    } else {
      return heatMultiplier;
    }
  }

  Evaluator::Evaluator(const Settings &settings)
    :settings(settings),
    rules(xt::empty<int>({settings.sizeX, settings.sizeY, settings.sizeZ})),
    isActive(xt::empty<bool>({settings.sizeX, settings.sizeY, settings.sizeZ})),
    isModeratorInLine(xt::empty<bool>({settings.sizeX, settings.sizeY, settings.sizeZ})),
    visited(xt::empty<bool>({settings.sizeX, settings.sizeY, settings.sizeZ})) {}

  int Evaluator::getTileSafe(int x, int y, int z) const {
    if (!state->in_bounds(x, y, z))
      return -1;
    return (*state)(x, y, z);
  }

  bool Evaluator::hasCellInLine(int x, int y, int z, int dx, int dy, int dz) {
    for (int n{}; n <= (settings.altCalc ? 4 : 1); ++n) {
      x += dx; y += dy; z += dz;
      int tile(getTileSafe(x, y, z));
      if (tile == Cell) {
        for (int i{}; i < n; ++i) {
          x -= dx; y -= dy; z -= dz;
          isModeratorInLine(x, y, z) = true;
        }
        if (getTileSafe(x, y, z) == Moderator) { // Moderator check probably not necessary but might as well put it in
          isActive(x, y, z) = true;
        }
        return true;
      } else if (tile != Moderator) {
        return false;
      }
    }
    return false;
  }

  int Evaluator::countAdjFuelCells(int x, int y, int z) {
    return hasCellInLine(x, y, z, -1, 0, 0)
         + hasCellInLine(x, y, z, +1, 0, 0)
         + hasCellInLine(x, y, z, 0, -1, 0)
         + hasCellInLine(x, y, z, 0, +1, 0)
         + hasCellInLine(x, y, z, 0, 0, -1)
         + hasCellInLine(x, y, z, 0, 0, +1);
  }

  bool Evaluator::isActiveSafe(int tile, int x, int y, int z) const {
    if (!state->in_bounds(x, y, z))
      return false;
    return (*state)(x, y, z) == tile && isActive(x, y, z) && (tile < Active || tile == Moderator || settings.activeHeatsinkPrime);
  }

  int Evaluator::countActiveNeighbors(int tile, int x, int y, int z) const {
    return
      + isActiveSafe(tile, x - 1, y, z)
      + isActiveSafe(tile, x + 1, y, z)
      + isActiveSafe(tile, x, y - 1, z)
      + isActiveSafe(tile, x, y + 1, z)
      + isActiveSafe(tile, x, y, z - 1)
      + isActiveSafe(tile, x, y, z + 1);
  }

  bool Evaluator::isTileSafe(int tile, int x, int y, int z) const {
    if (!state->in_bounds(x, y, z))
      return false;
    return (*state)(x, y, z) == tile;
  }

  int Evaluator::countNeighbors(int tile, int x, int y, int z) const {
    return
      + isTileSafe(tile, x - 1, y, z)
      + isTileSafe(tile, x + 1, y, z)
      + isTileSafe(tile, x, y - 1, z)
      + isTileSafe(tile, x, y + 1, z)
      + isTileSafe(tile, x, y, z - 1)
      + isTileSafe(tile, x, y, z + 1);
  }

  int Evaluator::countCasingNeighbors(int x, int y, int z) const {
    return
      + !state->in_bounds(x - 1, y, z)
      + !state->in_bounds(x + 1, y, z)
      + !state->in_bounds(x, y - 1, z)
      + !state->in_bounds(x, y + 1, z)
      + !state->in_bounds(x, y, z - 1)
      + !state->in_bounds(x, y, z + 1);
  }

  void Evaluator::run(const xt::xtensor<int, 3> &state, Evaluation &result) {
    result.invalidTiles.clear();
    result.cellsHeatMult = 0;
    result.cellsEnergyMult = 0;
    result.fuelCellMultiplier = 0;
    result.moderatorCellMultiplier = 0;
    result.cooling = 0.0;
    result.breed = 0; // Number of Cells
    isActive.fill(false);
    isModeratorInLine.fill(false);
    this->state = &state;
    for (int x{}; x < settings.sizeX; ++x) {
      for (int y{}; y < settings.sizeY; ++y) {
        for (int z{}; z < settings.sizeZ; ++z) {
          int tile((*this->state)(x, y, z));
          if (tile == Cell) {
            int adjFuelCells(countAdjFuelCells(x, y, z));
            rules(x, y, z) = -1;
            ++result.breed;
            if (settings.altCalc) {
              result.cellsHeatMult += ((adjFuelCells + 1) * (adjFuelCells + 2)) / 2;
              result.cellsEnergyMult += adjFuelCells + 1;
            } else {
              result.fuelCellMultiplier += adjFuelCells * 3;
            }
            result.moderatorCellMultiplier += countActiveNeighbors(Moderator, x, y, z) * (adjFuelCells + 1);
          } else {
            if (tile < Active) {
              rules(x, y, z) = tile;
            } else if (tile < Cell) {
              rules(x, y, z) = tile - Active;
            } else {
              rules(x, y, z) = -1;
            }
          }
        }
      }
    }

    for (int x{}; x < settings.sizeX; ++x) {
      for (int y{}; y < settings.sizeY; ++y) {
        for (int z{}; z < settings.sizeZ; ++z) {
          if ((*this->state)(x, y, z) == Moderator) {
            if (!isModeratorInLine(x, y, z)) {
              result.invalidTiles.emplace_back(x, y, z);
            }
          } else switch (rules(x, y, z)) {
            case Redstone:
              isActive(x, y, z) = countNeighbors(Cell, x, y, z);
              break;
            case Lapis:
              isActive(x, y, z) = countNeighbors(Cell, x, y, z)
                && countCasingNeighbors(x, y, z);
              break;
            case Enderium:
              isActive(x, y, z) = countCasingNeighbors(x, y, z) == 3
                && (!x || x == settings.sizeX - 1)
                && (!y || y == settings.sizeY - 1)
                && (!z || z == settings.sizeZ - 1);
              break;
            case Cryotheum:
              isActive(x, y, z) = countNeighbors(Cell, x, y, z) >= 2;
              break;
            case Manganese:
              isActive(x, y, z) = countNeighbors(Cell, x, y, z) >= 2;
          }
        }
      }
    }
    
    for (int x{}; x < settings.sizeX; ++x) {
      for (int y{}; y < settings.sizeY; ++y) {
        for (int z{}; z < settings.sizeZ; ++z) {
          switch (rules(x, y, z)) {
            case Water:
              isActive(x, y, z) = countNeighbors(Cell, x, y, z)
                || countActiveNeighbors(Moderator, x, y, z);
              break;
            case Quartz:
              isActive(x, y, z) = countActiveNeighbors(Moderator, x, y, z);
              break;
            case Glowstone:
              isActive(x, y, z) = countActiveNeighbors(Moderator, x, y, z) >= 2;
              break;
            case Helium:
              isActive(x, y, z) = countActiveNeighbors(Redstone, x, y, z) == 1
                && countCasingNeighbors(x, y, z);
              break;
            case Emerald:
              isActive(x, y, z) = countActiveNeighbors(Moderator, x, y, z)
                && countNeighbors(Cell, x, y, z);
              break;
            case Tin:
              isActive(x, y, z) =
                isActiveSafe(Lapis, x - 1, y, z) &&
                isActiveSafe(Lapis, x + 1, y, z) ||
                isActiveSafe(Lapis, x, y - 1, z) &&
                isActiveSafe(Lapis, x, y + 1, z) ||
                isActiveSafe(Lapis, x, y, z - 1) &&
                isActiveSafe(Lapis, x, y, z + 1);
              break;
            case Magnesium:
              isActive(x, y, z) = countActiveNeighbors(Moderator, x, y, z)
                && countCasingNeighbors(x, y, z);
              break;
            case EndStone:
              isActive(x, y, z) = countActiveNeighbors(Enderium, x, y, z);
              break;
            case Arsenic:
              isActive(x, y, z) = countActiveNeighbors(Moderator, x, y, z) >= 3;
          }
        }
      }
    }
    
    for (int x{}; x < settings.sizeX; ++x) {
      for (int y{}; y < settings.sizeY; ++y) {
        for (int z{}; z < settings.sizeZ; ++z) {
          switch (rules(x, y, z)) {
            case Gold:
              isActive(x, y, z) = countActiveNeighbors(Water, x, y, z)
                && countActiveNeighbors(Redstone, x, y, z);
              break;
            case Diamond:
              isActive(x, y, z) = countActiveNeighbors(Water, x, y, z)
                && countActiveNeighbors(Quartz, x, y, z);
              break;
            case Copper:
              isActive(x, y, z) = countActiveNeighbors(Glowstone, x, y, z);
            case Prismarine:
              isActive(x, y, z) = countActiveNeighbors(Water, x, y, z);
              break;
            case Obsidian:
              isActive(x, y, z) =
                isActiveSafe(Glowstone, x - 1, y, z) &&
                isActiveSafe(Glowstone, x + 1, y, z) ||
                isActiveSafe(Glowstone, x, y - 1, z) &&
                isActiveSafe(Glowstone, x, y + 1, z) ||
                isActiveSafe(Glowstone, x, y, z - 1) &&
                isActiveSafe(Glowstone, x, y, z + 1);
              break;
            case Aluminium:
              isActive(x, y, z) = countActiveNeighbors(Quartz, x, y, z)
              && countActiveNeighbors(Lapis, x, y, z);
              break;
            case Villiaumite:
              isActive(x, y, z) = countActiveNeighbors(EndStone, x, y, z)
              && countActiveNeighbors(Redstone, x, y, z);
              break;
            case Boron:
              isActive(x, y, z) = countActiveNeighbors(Quartz, x, y, z)
              && (countCasingNeighbors(x, y, z) || countActiveNeighbors(Moderator, x, y, z));
              break;
            case Silver:
              isActive(x, y, z) = countActiveNeighbors(Glowstone, x, y, z) >= 2
              && countActiveNeighbors(Tin, x, y, z);
          }
        }
      }
    }

    for (int x{}; x < settings.sizeX; ++x) {
      for (int y{}; y < settings.sizeY; ++y) {
        for (int z{}; z < settings.sizeZ; ++z) {
          switch (rules(x, y, z)) {
            case Iron:
              isActive(x, y, z) = countActiveNeighbors(Gold, x, y, z);
              break;
            case Fluorite:
              isActive(x, y, z) = countActiveNeighbors(Prismarine, x, y, z)
              && countActiveNeighbors(Gold, x, y, z);
              break;
            case NetherBrick:
              isActive(x, y, z) = countActiveNeighbors(Obsidian, x, y, z);
          }
        }
      }
    }

    for (int x{}; x < settings.sizeX; ++x) {
      for (int y{}; y < settings.sizeY; ++y) {
        for (int z{}; z < settings.sizeZ; ++z) {
          switch (rules(x, y, z)) {
            case Lead:
              isActive(x, y, z) = countActiveNeighbors(Iron, x, y, z);
              break;
            case Purpur:
              isActive(x, y, z) = countActiveNeighbors(Iron, x, y, z)
              && countCasingNeighbors(x, y, z);
          }
        }
      }
    }

    for (int x{}; x < settings.sizeX; ++x) {
      for (int y{}; y < settings.sizeY; ++y) {
        for (int z{}; z < settings.sizeZ; ++z) {
          int tile((*this->state)(x, y, z));
          if (tile < Cell) {
            switch (rules(x, y, z)) {
              case Slime:
                isActive(x, y, z) = countActiveNeighbors(Water, x, y, z)
                && countActiveNeighbors(Lead, x, y, z);
                break;
              case Lithium:
                isActive(x, y, z) =
                isActiveSafe(Lead, x - 1, y, z) &&
                isActiveSafe(Lead, x + 1, y, z) ||
                isActiveSafe(Lead, x, y - 1, z) &&
                isActiveSafe(Lead, x, y + 1, z) ||
                isActiveSafe(Lead, x, y, z - 1) &&
                isActiveSafe(Lead, x, y, z + 1);
                break;
              case Nitrogen:
                isActive(x, y, z) = countActiveNeighbors(Purpur, x, y, z)
                && countActiveNeighbors(Copper, x, y, z);
            }
            if (isActive(x, y, z))
              result.cooling += settings.coolingRates[tile];
            else
              result.invalidTiles.emplace_back(x, y, z);
          }
        }
      }
    }

    result.compute(settings);
  }
}
