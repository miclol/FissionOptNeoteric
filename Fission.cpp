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

  bool Evaluator::validateTile(int tile, int x, int y, int z) const {
    switch (tile) {
      case Cell:
        return isTileSafe(tile, x, y, z);
      case Casing:
        return !state->in_bounds(x, y, z);
      default:
        return isActiveSafe(tile, x, y, z);
    }
  }

  int Evaluator::validateNeighbors(int tile, int x, int y, int z) const {
    switch (tile) {
      case Cell:
        return countNeighbors(tile, x, y, z);
      case Casing:
        return countCasingNeighbors(x, y, z);
      default:
        return countActiveNeighbors(tile, x, y, z);
    }
  }
 
  bool Evaluator::parseRule(int rule, int x, int y, int z) const {
    int tile = rule & 255;
    int num = (rule >> 8) & 7;
    int checkType = rule >> 11;

    if (checkType >= 0 && checkType <= 2) {
      int neighbors = validateNeighbors(tile, x, y, z);
      switch (checkType) {
        case 0: return neighbors >= num;  // At Least
        case 1: return neighbors == num;  // Equal To
        case 2: return neighbors < num;   // Less Than
      }
    }

    if (checkType == 3) {  // In Between
      return (validateTile(tile, x - 1, y, z) && validateTile(tile, x + 1, y, z)) ||
            (validateTile(tile, x, y - 1, z) && validateTile(tile, x, y + 1, z)) ||
            (validateTile(tile, x, y, z - 1) && validateTile(tile, x, y, z + 1));
    }

    // Sharing vertex/edge
    int initial = validateTile(tile, x, y - 1, z) || validateTile(tile, x, y + 1, z);
    int dir[4][2] = {{0, -1}, {1, 0}, {0, 1}, {-1, 0}};
    int matches[4] = {};
    for (int i = 0; i < 4; i++) {
      if (validateTile(tile, x + dir[i][0], y, z + dir[i][1])) {
        if (1 + initial >= num) return true;
        matches[i] = 1;
      }
    }
    for (int k = 0; k < 4; k++) {
      if (matches[k] + matches[(k + 1) % 4] + initial >= num) {
        return true;
      }
    }
    return false;
  }

  void Evaluator::run(const xt::xtensor<int, 3> &state, Evaluation &result) {
    result.invalidTiles.clear();
    for (auto &tiles: result.cachedTilePos) { tiles.clear(); }
    result.cellsHeatMult = 0;
    result.cellsEnergyMult = 0;
    result.fuelCellMultiplier = 0;
    result.moderatorCellMultiplier = 0;
    result.cooling = 0.0;
    result.breed = 0; // Number of Cells
    isActive.fill(true);
    isModeratorInLine.fill(false);
    this->state = &state;
    auto &grid = *this->state;

    for (int x{}; x < settings.sizeX; ++x) {
      for (int y{}; y < settings.sizeY; ++y) {
        for (int z{}; z < settings.sizeZ; ++z) {
          int tile(grid(x, y, z)); 
          if (tile < Cell) {
            result.cachedTilePos[tile < Active ? tile : tile - Active].emplace_back(x, y, z);
          } else {
            isActive(x, y, z) = false;
          }
        }
      }
    }

    for (int x{}; x < settings.sizeX; ++x) {
      for (int y{}; y < settings.sizeY; ++y) {
        for (int z{}; z < settings.sizeZ; ++z) {
          if (grid(x, y, z) == Cell) {
            int adjFuelCells(countAdjFuelCells(x, y, z));
            ++result.breed;
            if (settings.altCalc) {
              result.cellsHeatMult += ((adjFuelCells + 1) * (adjFuelCells + 2)) / 2;
              result.cellsEnergyMult += adjFuelCells + 1;
            } else {
              result.fuelCellMultiplier += adjFuelCells * 3;
            }
            result.moderatorCellMultiplier += countActiveNeighbors(Moderator, x, y, z) * (adjFuelCells + 1);
          }
        }
      }
    }
    
    for (int tile: settings.schedule) {
      if (tile == -1) {
        break;
      }
      for (auto &[x, y, z]: result.cachedTilePos[tile]) {
        const std::vector<std::vector<int>> &rulesAnd = settings.rules[tile];
        int andCount = 0;
        for (auto &rulesOr: rulesAnd) {
          for (auto &rule: rulesOr) {
            if (parseRule(rule, x, y, z)) {
              andCount++;
              break;
            }
          }
        }
        isActive(x, y, z) = andCount == rulesAnd.size();
      }
    }

    for (int x{}; x < settings.sizeX; ++x) {
      for (int y{}; y < settings.sizeY; ++y) {
        for (int z{}; z < settings.sizeZ; ++z) {
          int tile(grid(x, y, z));
          if (tile < Cell) {
            if (isActive(x, y, z))
              result.cooling += settings.coolingRates[tile];
            else
              result.invalidTiles.emplace_back(x, y, z);
          } else if (tile == Moderator) {
            if (!isModeratorInLine(x, y, z)) {
              result.invalidTiles.emplace_back(x, y, z);
            }
          }
        }
      }
    }

    result.compute(settings);
  }
}
