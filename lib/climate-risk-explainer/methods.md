---
date: 11-18-2025
title: Open climate risk wildfire methods
card: TK
quickLook: The scientific methods underpinning the OCR dataset and web tool.
back: /research/climate-risk-explainer
fileId: 1Xpm0uDrgO9lpJMTUcZ80uoK_LiaSrgMEhpU5C5FctxI
slug: climate-risk-fire-methods
components:
  - name: Table
    src: '@carbonplan/components'
---

# Methods

Here we describe the methods we used to produce a 30-meter spatial resolution gridded dataset of fire risk for the conterminous United States (CONUS) under both present-day and future climate conditions. We explain how we sample that dataset to estimate risk for approximately 160 million buildings across CONUS. Both the raster and the building-level risks can be explored in an accompanying [interactive map tool](/research/climate-risk). Our approach both relies on and extends a set of methods and data previously released by the United States Forest Service (USFS), as described below.

## Input datasets

Our approach relies on four input datasets:

<Table
  columns={6}
  start={[1, 3]}
  width={[2, 4]}
  data={[
    [
      <a href='https://doi.org/10.2737/RDS-2025-0006'>Riley et al. (2025)</a>,
      'A 270 m raster including annual burn probability (BP) for present day (2011) and future (2047) climates. Landscape (e.g., vegetation type) were held fixed with conditions at the end of 2020 (circa 2021). The data is only available for wildland areas, with all other land explicitly considered “non-burnable.”',
    ],
    [
      <a href='https://doi.org/10.1175/BAMS-D-21-0326.1'>
        Rasmussen et al. (2023)
      </a>,
      'A 4 km gridded, hourly meteorological raster including u and v wind speeds, temperature, and specific humidity. The data is available for all of CONUS.',
    ],
    [
      <a href='https://doi.org/10.2737/RDS-2020-0016-2'>Scott et al. (2024)</a>,
      'A 30 m raster of conditional risk to potential structures (cRPS) for present day (circa 2023). The data is available for all of CONUS.',
    ],
    [
      <a href='https://docs.overturemaps.org/guides/buildings/#14/32.58453/-117.05154/0/60'>
        Overture Maps Foundation buildings dataset
      </a>,
      'A collection of ~160 million buildings across the conterminous United States.',
    ],
  ]}
  index={false}
/>

## Validation datasets

<Table
  columns={6}
  start={[1, 3]}
  width={[2, 4]}
  data={[
    [
      <a href='https://doi.org/10.2737/RDS-2020-0016-2'>Scott et al. (2024)</a>,
      'A 30 m raster of risk to potential structures (RPS) for present day (end of 2023). The data is available for all of CONUS.',
    ],
    [
      <a href='https://osfm.fire.ca.gov/what-we-do/community-wildfire-preparedness-and-mitigation/fire-hazard-severity-zones'>Cal Fire <em>Fire hazard severity zones</em> (2024)</a>,
      'A vector of hazard zones with three levels of hazard (moderate, high, very high) with all other areas considered without hazard. The data is available for the state of California.',
    ],

]}
index={false}
/>

## Summary of approach for spreading burn probabilities into non-wildland areas

Existing estimates of burn probability produced by Riley et al. (2025) only include estimates for “wildland areas.” Other land types — such as urban and suburban areas — are treated as “non-burnable” in their approach. Most developed land in the wildland urban interface is outside of their domain, so it is not possible to quantify fire risk to individual homes using their data without further processing.

Scott et. al (2024) addressed this problem by spreading (referred to in their documentation as “oozing”) burn probabilities from an earlier version of the Riley dataset. That approach used a static spreading function. The California Department of Forestry and Fire Protection (Cal Fire), adopted a [related approach](https://osfm.fire.ca.gov/what-we-do/community-wildfire-preparedness-and-mitigation/fire-hazard-severity-zones) when developing its fire hazard severity zones by taking into account historical wind patterns and accounting for the production and accumulation of embers entering non-wildland areas.

Our approach, which we applied to all of CONUS, accounts for historical wind conditions, but does not explicitly account for ember production or transport. As such, it can be viewed mostly as a modification of Scott et al. (2024), while stopping short of the more process-based approach developed by CAL FIRE. Where Scott et al. (2024) adopted a fixed radius spreading function, we modified the shape of our spreading function based on the prevalent wind direction from the historical period within a 4 km region under fire-weather conditions. This allowed us to transfer burn probability estimates from Riley et al. (2025), which exist only for wildland regions, to non-wildland environments.

## Detailed approach to spreading burn probabilities

Our approach for spreading burn probabilities into non-wildland areas has four steps: initial gap filling; calculating the distribution of wind directions under severe fire-weather conditions; creating a wind-informed extrapolation function; and finally, applying a localized spreading to soften spatial artifacts.

### 01 — Initial gap filling

We began by filling gaps in the underlying Riley et al. (2025) burn probability dataset that i) are one pixel in size, and ii) are surrounded on four sides by valid burn probability estimates. This removed checkerboard features from the underlying dataset, while preserving distinct wildland/non-wildland edges.

### 02 — Calculating wind distributions for each pixel under fire-weather conditions

We used high resolution (4 km), downscaled meteorological reanalysis data to calculate the distribution of prevailing winds under fire-weather conditions (Rasmussen et al. 2023). First, we calculated the Fosberg Fire Weather Index (FFWI) for every hour over the period of 1979 to 2022, using hourly estimates of temperature, relative humidity, and wind speed components _u_ and _v_ (Fosberg 1978). Then, for every pixel, we calculated the 99<sup>th</sup> percentile of FFWI and extracted the wind direction for all hours exceeding that threshold (hereinafter referred to as “fire-weather wind direction”). We then binned the fire-weather wind directions into the eight cardinal and ordinal directions and created a distribution of fire-weather wind directions for each pixel, where the total weight across all wind directions sums to 1.

### 03 — Spreading burn probability according to wind direction

For every 30 m pixel, we began by creating eight oval-shaped blurring filters, one for each cardinal and ordinal direction. The oval shape mimics the elliptical wavelets of Richards (1990). The oval is positioned such that the pixel in question is located 510 meters along the major axis. The vertex of the oval closest to the given pixel extends beyond the pixel, in the direction opposite of the prevailing wind.

After laying out the eight ovals circling each pixel, we calculated the weighted mean burn probability of all 30 m pixels from Riley et al. (2025) that fall under our wind-informed ovals. The contribution of each oval filter is weighted by the relative frequency of that wind direction within the fire-weather wind direction data. We repeated this process for each pixel three times, resulting in a spread of non-zero burn probability into non-burnable areas up to a maximum of 1,530 m. We only used this approach to adjust the burn probability of pixels categorized as having a burn probability of zero in our gap-filled version of the Riley et al. (2025) dataset. This means we did not adjust the burn probabilities calculated by Riley et al. (2025) and, instead, only used this approach to estimate burn probabilities in non-burnable areas.

### 04 — Localized blurring

As a final step, we applied a small (~300 ft radius) Gaussian kernel to blur the burn probability raster. This resolved sharp spatial artifacts, especially in areas where the prevailing winds blow from developed areas toward high burn probability wildland areas, which tended to thus create sharp edges upon replacement with the original wildland burn probability values from Riley et al. (2025).

## Calculating risk

After estimating burn probabilities, we multiplied those estimates with estimates of “conditional risk to potential structures” (cRPS) developed by Scott et al. (2024). cRPS represents the conditional net value change in a hypothetical (i.e., generic) structure at a given pixel if it were to burn. cRPS does not take into account the specific attributes (e.g., roofing materials) of any actual structure located within a 30 m pixel. A cRPS value of 100 corresponds to a total loss whereas a cRPS value of 0 corresponds to no damage, so we interpret cRPS as a likelihood, or percentage, loss.

Multiplying cRPS by burn probability resulted in an estimate of the risk to potential structures (RPS), which we interpreted as the expected risk of loss (%) experienced by a hypothetical structure in each pixel per year.

RPS combines both probability and consequence, potentially complicating interpretation. For example, a high BP value could still result in a low RPS value, if cRPS is low. As stated above, the hypothetical structure considered in cRPS is generic and does not consider any attributes about structure aside from its location. We calculated risk for every pixel in CONUS, regardless of the presence of a structure. This extended coverage supports, for example, analysis in zones of proposed development or in areas which have been developed since the input datasets were finalized, with the caveat that extensive development could invalidate the underlying cRPS and BP data.

## Risk to score mapping

To aid interpretability, we converted continuous values of RPS into a categorical risk score on a scale from 0 to 10. Any RPS value of 0 was cast to a score of 0 and any non-zero risk score has a non-zero RPS value in the dataset. We crafted the score bins by calculating percentiles of RPS values for 156 million buildings in the Overture Maps Foundation building dataset (see below). The breakpoints between bins grow increasingly clustered at higher RPS values, such that there are ~10,000,000 buildings with score of 2, but only ~2,500 buildings with score of 10. This psuedo-logrithmic design allows us to distinguish among risk values across the highly heterogeneous domain where risk values span multiple orders of magnitude. The approach mimics that of the Wildfire Risk to Communities project, though they used five categories of risk and calculated their percentiles across all lands, as opposed to buildings.

## Building-level risk

We intersected the 30 m RPS raster with the footprints of individual buildings contained within [the Overture Maps Foundation buildings dataset](https://docs.overturemaps.org/guides/buildings/#14/32.58453/-117.05154/0/60). We assigned each building a risk value based on the nearest pixel within our RPS dataset to the centroid of each building. Previous work has shown that small decisions about spatial joins with risk maps can have an [outsized influence](https://www.fca.org.uk/publication/corporate/risk-professionals-guide-physical-risk-assessments-garp-benchmarking-study-13-vendors.pdf) on the final result.

## Displaying data in web tool

Within our web tool, we made buildings searchable by address using [HERE Maps](https://www.here.com/). First, we get the latitude and longitude for a user-provided address (“geocoding”). We then return the risk information of whatever building within the Overture buildings dataset is nearest to those coordinates.

The building-level data is also visible in the web tool alongside the underlying 30 m RPS raster. The result is an interface that enables searching for risk across CONUS at the address level. The inclusion of both raster and building datasets side-by-side supports the interrogation of building risk assignments, as well as risk information in undeveloped areas where developments might be proposed. The web tool also displays summary statistics for several types of geographic areas: census block, census tract, and county, which helps contextualize an individual building’s risk score. Finally, in addition to the 1-year RPS value, it displays the risk — assuming at least one burn over 15- and 30-year time horizons.

We provide building-level RPS estimates, including spatial subsets of the data, for [download](https://carbonplan.github.io/ocr/reference/data-downloads/) in CSV, GeoParquet, and GeoPackage formats. Downloads of spatially-aggregated data (e.g., data for all census tracts across CONUS) include summary statistics (e.g., median score across buildings), as well as the count of buildings within each risk score in each summary region.
