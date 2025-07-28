#ifndef _FISSION_H_
#define _FISSION_H_
#include <xtensor/xtensor.hpp>
#include <string>

namespace Fission {
  using Coords = std::vector<std::tuple<int, int, int>>;

  enum {
    // Cooler
    Water, Redstone, Helium, Enderium, Cryotheum, Nitrogen, Quartz, Gold,
    Glowstone, Lapis, Diamond, Iron, Emerald, Copper, Tin, Magnesium,
    Manganese, EndStone, Arsenic, Prismarine, Obsidian, Aluminium, Villiaumite,
    Boron, Silver, Fluorite, NetherBrick, Lead, Purpur, Slime, Lithium, Active,
    // Other
    Cell = Active * 2, Moderator, Air, Casing
  };

  enum {
    GoalPower,
    GoalBreeder,
    GoalEfficiency
  };

  struct Settings {
    int sizeX, sizeY, sizeZ;
    double fuelBasePower, fuelBaseHeat;
    int limit[Air];
    double coolingRates[Cell];
    bool ensureHeatNeutral;
    int goal;
    bool symX, symY, symZ;
    double temperature;
    bool altCalc, activeHeatsinkPrime;
    double genMult, heatMult, modFEMult, modHeatMult, FEGenMult;
    std::vector<std::vector<int>> rules[Active];
    int schedule[Cell];
  };

  struct Evaluation {
    // Raw
    Coords invalidTiles;
    Coords cachedTilePos[Cell];
    double cooling;
    int breed, fuelCellMultiplier, moderatorCellMultiplier, cellsHeatMult, cellsEnergyMult;
    // Computed
    double heat, netHeat, dutyCycle, power, avgPower, avgBreed, efficiency;

    void compute(const Settings &settings);
    double heatMultiplier(double heatPerTick, double coolingPerTick, double heatMult, bool altCalc);
  };

  class Evaluator {
    const Settings &settings;
    xt::xtensor<bool, 3> isActive, isModeratorInLine, visited;
    const xt::xtensor<int, 3> *state;
    
    int getTileSafe(int x, int y, int z) const;
    int getAdjFuelCellsCountSafe(int x, int y, int z) const;
    bool hasCellInLine(int x, int y, int z, int dx, int dy, int dz);
    int countAdjFuelCells(int x, int y, int z);
    bool isActiveSafe(int tile, int x, int y, int z) const;
    int countActiveNeighbors(int tile, int x, int y, int z) const;
    bool isTileSafe(int tile, int x, int y, int z) const;
    int countNeighbors(int tile, int x, int y, int z) const;
    int countCasingNeighbors(int x, int y, int z) const;
    bool validateTile(int tile, int x, int y, int z) const;
    int validateNeighbors(int tile, int x, int y, int z) const;
    bool parseRule(int rule, int x, int y, int z) const;
  public:
    Evaluator(const Settings &settings);
    void run(const xt::xtensor<int, 3> &state, Evaluation &result);
  };
}

#endif
