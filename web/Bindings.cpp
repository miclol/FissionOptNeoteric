#include <emscripten/bind.h>
#include "../FissionNet.h"

static void setLimit(Fission::Settings &x, int index, int limit) {
  x.limit[index] = limit;
}

static void setRate(Fission::Settings &x, int index, double rate) {
  x.coolingRates[index] = rate;
}

static void clearSchedule(Fission::Settings &x) {
  std::fill_n(x.schedule, sizeof(x.schedule) / sizeof(x.schedule[0]), 0);
}

static void setSchedule(Fission::Settings &x, int index, int heatSinkType) {
  x.schedule[index] = heatSinkType;
}

static void clearRules(Fission::Settings &x) {
  for (auto &rule: x.rules) {
    rule.clear();
  }
}

static void setRule(Fission::Settings &x, int hsIndex, int ruleIndex, int rule) {
  if (ruleIndex >= x.rules[hsIndex].size()) {
    x.rules[hsIndex].resize(ruleIndex + 1);
  }
  x.rules[hsIndex][ruleIndex].emplace_back(rule);
}

static emscripten::val getData(const Fission::Sample &x) {
  return emscripten::val(emscripten::typed_memory_view(x.state.size(), x.state.data()));
}

static int getShape(const Fission::Sample &x, int i) {
  return x.state.shape(i);
}

static int getStride(const Fission::Sample &x, int i) {
  return x.state.strides()[i];
}

static double getPower(const Fission::Sample &x) {
  return x.value.power;
}

static double getHeat(const Fission::Sample &x) {
  return x.value.heat;
}

static double getCooling(const Fission::Sample &x) {
  return x.value.cooling;
}

static double getNetHeat(const Fission::Sample &x) {
  return x.value.netHeat;
}

static double getDutyCycle(const Fission::Sample &x) {
  return x.value.dutyCycle;
}

static double getAvgPower(const Fission::Sample &x) {
  return x.value.avgPower;
}

static double getAvgBreed(const Fission::Sample &x) {
  return x.value.avgBreed;
}

static double getEfficiency(const Fission::Sample &x) {
  return x.value.efficiency;
}

static emscripten::val getLossHistory(const Fission::Opt &opt) {
  auto &data(opt.getLossHistory());
  return emscripten::val(emscripten::typed_memory_view(data.size(), data.data()));
}

EMSCRIPTEN_BINDINGS(FissionOpt) {
  emscripten::class_<Fission::Settings>("FissionSettings")
    .constructor<>()
    .property("sizeX", &Fission::Settings::sizeX)
    .property("sizeY", &Fission::Settings::sizeY)
    .property("sizeZ", &Fission::Settings::sizeZ)
    .property("fuelBasePower", &Fission::Settings::fuelBasePower)
    .property("fuelBaseHeat", &Fission::Settings::fuelBaseHeat)
    .function("setLimit", &setLimit)
    .function("setRate", &setRate)
    .function("clearSchedule", &clearSchedule)
    .function("setSchedule", &setSchedule)
    .function("clearRules", &clearRules)
    .function("setRule", &setRule)
    .property("ensureHeatNeutral", &Fission::Settings::ensureHeatNeutral)
    .property("goal", &Fission::Settings::goal)
    .property("symX", &Fission::Settings::symX)
    .property("symY", &Fission::Settings::symY)
    .property("symZ", &Fission::Settings::symZ)
    .property("temperature", &Fission::Settings::temperature)
    .property("altCalc", &Fission::Settings::altCalc)
    .property("genMult", &Fission::Settings::genMult)
    .property("heatMult", &Fission::Settings::heatMult)
    .property("modFEMult", &Fission::Settings::modFEMult)
    .property("modHeatMult", &Fission::Settings::modHeatMult)
    .property("FEGenMult", &Fission::Settings::FEGenMult)
    .property("activeHeatsinkPrime", &Fission::Settings::activeHeatsinkPrime);
  emscripten::class_<Fission::Sample>("FissionSample")
    .function("getData", &getData)
    .function("getShape", &getShape)
    .function("getStride", &getStride)
    .function("getPower", &getPower)
    .function("getHeat", &getHeat)
    .function("getCooling", &getCooling)
    .function("getNetHeat", &getNetHeat)
    .function("getDutyCycle", &getDutyCycle)
    .function("getAvgPower", &getAvgPower)
    .function("getAvgBreed", &getAvgBreed)
    .function("getEfficiency", &getEfficiency);
  emscripten::class_<Fission::Opt>("FissionOpt")
    .constructor<const Fission::Settings&, bool>()
    .function("stepInteractive", &Fission::Opt::stepInteractive)
    .function("needsRedrawBest", &Fission::Opt::needsRedrawBest)
    .function("needsReplotLoss", &Fission::Opt::needsReplotLoss)
    .function("getLossHistory", &getLossHistory)
    .function("getBest", &Fission::Opt::getBest)
    .function("getNEpisode", &Fission::Opt::getNEpisode)
    .function("getNStage", &Fission::Opt::getNStage)
    .function("getNIteration", &Fission::Opt::getNIteration);
}
