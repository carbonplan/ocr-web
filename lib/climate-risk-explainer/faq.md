---
date: 11-12-2025
title: Open climate risk FAQ
color: red
quickLook: FAQ for our open climate risk project
back: /research/climate-risk-explainer
fileId: 1_aa2T_oIVQFObheQ-cevHTVSXQQMUl5yEk9D5s2TiGA
slug: climate-risk-faq
components:
  - name: FactorsTable
    src: ./components/factors-table.js
---

# FAQ

<Box
  sx={{
    color: 'secondary',
    '& p': { fontSize: [2, 2, 2, 3] },
    '& a': { color: 'secondary', '&:hover': { color: 'primary' } },
  }}
>
  We are publishing responses to frequently asked technical questions about our
  [Open Climate Risk](/research/climate-risk) web tool. Many of these questions
  are answered in the explainer article [“Making climate risk
  open”](/research/climate-risk-explainer) or its accompanying [methods
  page](/research/climate-risk-fire-methods) and detailed [technical
  documentation](https://carbonplan.github.io/ocr/). We developed this FAQ to
  further support accessibility.
</Box>

## 01 — What do the risk scores actually represent?

The risk score for a building is the categorical measure of our model’s estimated risk to potential structures at the location of that building. A higher score denotes a higher underlying RPS value. The categorical score can be helpful for comparing across buildings or assessing distributions of buildings within a specific geographic area (e.g. census tract, county). The scores grow increasingly less prevalent at higher values - while there are ~10,000,000 buildings with a fire score of 2, there are only ~2,500 buildings with a fire score of 10. Scores are categorical, meaning that a building with a score 2 has a higher RPS than a building with a score 1, but it is not double. The exact RPS bin definitions are included in the color bar of the tool. See [here](https://carbonplan.github.io/ocr/methods/fire-risk/score-bins/) for additional information.

## 02 — What are some features and shortcomings of your model?

Our model relies on [results](https://www.fs.usda.gov/rds/archive/products/RDS-2025-0006/_metadata_RDS-2025-0006.html) from FSim, a process-based wildfire model. We begin with results of present day burn probability across all wildlands, and then extend those estimates into developed areas according to the direction that fire-weather-driven winds might drive them. We repeat this process for burn probability estimates under climate change, while, crucially, keeping the wind effects and vegetation/fuels map fixed.

Our model doesn’t account for several highly important factors which could influence the actual fire risk of a given location.

<FactorsTable />

## 03 — Why do some buildings right next to each other have different risk scores?

Every building is assigned a risk score based upon the RPS value that is closest to the centroid of the building. The RPS raster is the product of two different values: (1) burn probability (BP), a relatively smooth layer due to progressive smoothing steps and (2) conditional risk to potential structures (cRPS), a layer with comparatively greater spatial structure. cRPS has sharper boundaries between pixels than BP because it, under the hood, integrates the LANDFIRE vegetation model which assigns different vegetation classes to each 30m pixel, some of them with high cRPS values (e.g. trees) and some low (e.g. developed areas). Because neighboring pixels might have very different characteristics (especially in areas like the intermix wildland urban interface where trees are interspliced with development), there can be pixels with disparate cRPS (and thus RPS) values next to each other, introducing sharp spatial boundaries. Buildings straddling these boundaries will inherit those spatial artifacts.

## 04 — Why do some areas show decreasing risk in the future? Doesn’t climate change make wildfires worse?

The burn probability (BP) estimates driving our risk values come from a present-day and a future run of the FSim (Fire Simulator) model. BP is largely expected to increase in the future due to increased temperatures and exacerbated drying. However, core to FSim’s approach is that it stochastically integrates ignitions and weather streams, simulating tens of thousands of different years of fires to calculate a burn probability. Some pixels will just randomly happen to burn more frequently in the present-day simulations than in the future, particularly in places with low fire occurrence and thus a smaller sample size. Because cRPS is held fixed across time periods, a decreased future BP would necessarily cause a decreased future RPS.

## 05 — What climate scenarios are used for future risk projection?

The present-day risk estimates are based upon the climate for the period 2004-2018, which was the calibration period of record for the FSim model our results are based on. The future risk estimates rely on climate model simulations covering 2040-2054 using six GCMs from CMIP5 following the RCP8.5 emissions scenario. See [here](https://www.fs.usda.gov/rds/archive/catalog/RDS-2025-0006) for more information.

## 06 — How is this different from other risk models?

We’ve compared our estimates with those from the [Wildfire Risk to Communities](wildfirerisk.org) effort, which inspired our approach, as well as the Cal Fire [Fire Hazard Severity Zones](https://osfm.fire.ca.gov/what-we-do/community-wildfire-preparedness-and-mitigation/fire-hazard-severity-zones). We are more similar to the former, which is to be expected since our approaches are so similar. We do not know how we compare with private models, whether numerically or in design, given the often proprietary nature of the estimates from private companies. We welcome any opportunity to compare our estimates with others.
