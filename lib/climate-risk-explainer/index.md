---
date: 11-12-2025
title: Making climate risk data open
authors:
  - Oriana Chegwidden
  - Chris Allen
  - Tracy Aquino Anderson
  - Anderson Banihirwe
  - Jeremy Freeman
  - Raphael Hagen
  - Tyler Kukla
  - Shane Loeffler
  - Kata Martin
color: red
summary: We’re releasing Open Climate Risk, a platform which transparently reveals present-day and future fire risks for buildings across the contiguous United States.
quickLook: Building-level fire risks for now and the future, across the United States.
components:
  - name: OverviewMap
    src: ./components/overview-map.js
  - name: CountyMap
    src: ./components/county-map.js
  - name: WindComparison
    src: ./components/wind-comparison.js
  - name: SummaryTable
    src: ./components/summary-table.js
links:
  - label: Map tool
    href: /research/climate-risk
  - label: Methods
    href: /research/climate-risk-fire-methods
  - label: FAQ
    href: /research/climate-risk-faq
  - label: Download data
    href: https://carbonplan.github.io/ocr/reference/data-downloads/
back: /research/climate-risk
fileId: 1jqDGZD2BTeMyhIFaZa3xHKLSeEiNmilZIqyPmesysfs
---

Will a levee hold? Will a prospective homebuyer have access to a mortgage? Will a farmer be able to plant a particular crop? In each case, the availability of high-quality climate risk data could make the difference between safety and calamity, prosperity and sustained hardship.

The private sector understands the need for climate data. Earlier this year Boston Consulting Group estimated private equity investment opportunities in the climate and resilience adaptation market will grow from $0.5 trillion to $1.3 trillion per year by 2030, and identified climate intelligence solutions as the subsector expected to grow the most quickly.<Cite id='oehling.2025' /> “Extreme weather events and climate hazards are increasing in probability and rising in terms of impact, so investors that keep abreast with the latest climate science and data across regions will be able to stay one step ahead and position themselves to capture the most attractive opportunities,” the report encourages. The public is also starting to draw connections between the prediction of risk and its economic consequences, most clearly when it comes to insurance availability and cost. In climate-impacted states that elect insurance commissioners, some of these elections have become proxies for [public frustration over rising premiums] (https://grist.org/elections/climate-impacts-put-insurance-commissioner-races-in-the-spotlight).

Yet despite the importance of climate risk data, and the growth of private analytics firms producing it, almost none of that data is available to the public.<Cite id='condon.2023' /> You can type an address into Zillow and get a handful of climate risk scores, but you can’t see how those scores were calculated. Your tax dollars likely funded the creation of the base datasets that an analytics company uses in its wildfire risk model, but for your local government to use the model to protect your neighborhood, they likely have to sign a restrictive contract with a company, and pay a significant fee. As legal scholar Madison Condon summarizes this worrisome state of affairs, “The climate risk information available to individual citizens and municipalities . . . is limited and expensive to access.”

Further, private companies can provide different risk estimates for the same place, a pattern we found when [comparing](https://carbonplan.org/research/climate-risk-comparison) the scores of two risk providers that shared data with us. Our findings were in agreement with two other studies, one focused on climate-related financial risks and the other on flood risks in Los Angeles.<Cite ids={['hain.2021', 'schubert.2024']} /> The Global Association of Risk Providers (GARP) leveraged access to proprietary data and found that “leading vendors can deliver strikingly different results.”<Cite id='paisley.2025' /> As citizens and governments increasingly require accurate climate risk assessments to make consequential planning decisions, they have no way of understanding which assessments are actually appropriate for their needs, because the data and methods that underlie physical risk providers’ models are proprietary.

In response, we’ve created an open source dataset of fire risk estimates at the scale of individual buildings for the contiguous United States (CONUS). The dataset and methods that drive the predictions are inspectable by anyone. We’ve also created a fully open platform — Open Climate Risk — that allows users to explore, download, and analyze the dataset.

In this explainer, we share what our climate risk platform does, how we built it, and how it compares to other efforts. We’ll share how to access all of the underlying data and modeling, and explain why that transparency is unique and important. We’ll share our next steps for the platform, and more broadly, our vision for public access to risk data. But first, we need to define climate risk, and risk modeling.

## What is climate risk

Scientists can estimate climate risk at different scales, within two dimensions. Geographically, the scale can range from the large-scale (e.g., global, regional) to the small-scale (e.g., local, building-level). Temporally, an assessment can apply to the current climate, or a future climate, and can compound over multiple years (e.g., by giving the risk that a building will be inundated by a flood at some point within the span of a decade). Each combination requires a predictive model, and any model will embody many methodological choices about factors ranging from [downscaling algorithms](https://carbonplan.org/research/cmip6-downscaling-explainer) to vegetation maps. Providers of physical risk assessments typically use one of two types of model.<Cite id='paisley.2025' hide /> Climate risk models (our work) involve translating historical weather observations and the outputs of global circulation models (GCMs) into risk assessments at a given spatio-temporal resolution. Catastrophe models, which are common in the insurance industry, involve probabilistic analyses of historical climate data, and often draw on rich datasets about the vulnerability of specific assets.

Three primary concepts underpin a risk assessment: risk, hazard, and vulnerability.<Cite id='dawkins.2023' /> The risk of a certain impact — say, the total loss of a structure from wildfire — is the product of (1) the probability that the structure is exposed to a hazard (e.g., a wildfire of a particular intensity) and (2) the structure’s degree of vulnerability (depending on factors as diverse as building materials, vegetation, and a jurisdiction’s resilience infrastructure). A good building-level climate risk product gives a reliable estimate at a local scale, rather than estimating the probability of a hazard for a larger region (e.g., averaged across a county), across which there might be substantial variability due to factors like topography or vegetation.

## What we’re releasing

Open Climate Risk (OCR) is a fully open platform that allows you to explore climate risks at the scale of individual buildings across the contiguous United States. In this initial release, we’re sharing estimates of wildfire risk to structures under both current and future climate conditions.

<Figure>
  <OverviewMap />
  <FigureCaption number={1}>
    Risk of loss to potential structures across the U.S., under current and
    future climates. Lighter, yellow colors indicate higher risk. Risk increases
    in the future across the western and central U.S. At this country-wide
    scale, the values here largely reflect those in Riley et al. (2025), which
    covered wildlands across the country.
    <Cite id='riley.2025' />
  </FigureCaption>
</Figure>

Our release includes three main components — an interactive web tool, the dataset that powers the tool, and the code that created the data. The dataset and code are open source, meaning that others can both check our work and build upon it. The webmap allows you to look up the wildfire risk of individual buildings by address, compare that building against others nearby, and examine regional patterns of wildfire risk. The webmap also reveals upstream values that explain where a building’s risk assignment came from. You can also download and freely use the underlying risk estimates displayed in the tool, whether for buildings or as gridded maps. We’ve also taken steps to make the input datasets that went into our analysis — all of which are free to use — easy to work with in the cloud. Finally, we provide a set of aggregated data — available in both CSV and GeoParquet — that characterize wildfire risk over counties, census blocks, and census tracts to support applications at a variety of scales.

<Figure>
  <SummaryTable />
  <TableCaption number={1}>
    Our dataset covers buildings across the contiguous United States and is
    fully inspectable whether in the web tool or via downloads for follow-on
    analyses.
  </TableCaption>
</Figure>
## How we built our wildfire model We developed the Open Climate Risk (OCR) wildfire
model to be reproducible and reliant on only free, publicly available input data.
Our fire model [methods](/research/climate-risk-fire-methods) extends previous work
by the United States Forest Service (USFS), incorporating a new technique for estimating
wildfire risk in communities based on nearby burn probability data. The fire model
relies on four input datasets:

- Riley et al. (2025) — an annual burn probability (BP) raster dataset at 270 m resolution, produced by the USFS. It includes BP data for present day (circa 2011) and future (circa 2047) climates based on landscape (e.g., vegetation type) conditions circa 2020. The data is only available for wildland areas, with all other land (e.g., developed neighborhoods in the wildland urban interface) considered “non-burnable” (often developed) in their modeling framework.<Cite id='riley.2025' />
- Rasmussen et al. (2023) — a 4 km gridded hourly meteorological dataset. It includes wind speeds, wind direction, temperature, and specific humidity — variables used to estimate how burn probability could spread from burnable wildlands to adjacent “non-burnable” land.<Cite id='rasmussen.2023' />
- Scott et al. (2024) — a conditional risk to potential structures (cRPS) raster dataset for the present day (circa 2023) at 30 m resolution. cRPS is a metric for potential damage of a fire to a generic structure based on factors such as fire intensity. The dataset was produced as part of the Wildfire Risk to Communities (WRC) project.<Cite id='scott.2024' />
- [Overture Maps Foundation buildings dataset](https://docs.overturemaps.org/guides/buildings/#14/32.58453/-117.05154/0/60) — a collection of 156 million buildings in the contiguous United States.<Cite id='overture.2025' />

There are no established standards for turning input data like these into a risk estimate.<Cite id='fiedler.2021' /> The art is in determining what aspects of the risk we want to model and what information we have available to drive the model. We chose to mostly rely on existing methods for calculating wildfire risk, building on the USFS WRC project.<Cite id='scott.2024' hide /> Their dataset, developed in partnership with the for-profit company [Pyrologix](https://pyrologix.com/) and the nonprofit organization [Headwater Economics](https://headwaterseconomics.org/), quantifies wildfire risk using cRPS and BP data. To our knowledge, it is the only publicly available high-resolution present-day fire product for CONUS.

We built on the existing WRC product in three ways. First, we expanded the dataset to include future risk estimates, relying on an updated BP dataset for present and future climates.<Cite id='riley.2025' hide />

Second, we developed a new technique for estimating BP in developed lands that accounts for historical meteorological information, since the original BP data only applies to wildlands. Our technique for calculating BP in developed lands focuses on the role of wind. Wind is a key driver of wildfire spread, carrying embers that present fire risk beyond wildlands, sometimes far ahead of the flame front. Hot, dry, and windy conditions can cause fires to expand faster than communities can manage them, and the prevalence of these conditions has led fire growth rates to more than double across the western U.S. between 2001 and 2020.<Cite id='balch.2024' /> The directionality of winds during fire weather is understudied, and has not previously been integrated into any public CONUS-scale fire risk product. The state of California gave credence to this theory in their use of directionality to model risk in Cal Fire’s Fire Hazard Severity Zone map, which we use in an intercomparison with our dataset, described below.

To account for the directionally-specific effects of wind, we identified wind patterns during the hottest and driest days, and used them to “spread” areas of high BP into areas which Riley et al. (2025) deemed “unburnable.” Our approach is inspired by the “oozing” method in Scott et al. (2024). We used a blurring filter to spread BP into non-burnable areas following local wind trajectories at hot, dry, and windy times as identified in Rasmussen et al. (2023). By expanding the BP data into developed areas, we were able to estimate their wildfire risk. We then multiplied the gridded, wind-spread BP layers for both present day and future climates with the fine scale cRPS layer to derive a 30 m gridded raster of risk to potential structures (RPS) for CONUS.

Finally, and as a third enhancement of the WRC dataset, we intersected the RPS raster with the Overture dataset to estimate RPS for 156 million buildings across the country. We display those values in the web tool, and make them searchable via address using a nearest-neighbor lookup.

<Figure>
  <WindComparison />

  <FigureCaption number={2}>
Comparing the risk from Scott et al. (2024) and our method for the Altadena neighborhood of Los Angeles, where a devastating urban conflagration hit in early 2025. The risk of loss (i.e., RPS) maps differ between the two datasets, with wind spreading risk south into communities for our dataset while the Scott et al. approach spreads risk uniformly. Streets data from <Link href="https://www.openstreetmap.org/copyright">OpenStreetMap</Link>.
  </FigureCaption>
</Figure>

In addition to providing maps of wildfire risk, we developed a risk scoring system based on the distribution of risk estimates for the buildings in the dataset. These eleven categorical bins range from zero (0% risk) to ten (greater than 3% risk). As in the WRC project, the bin breakpoints were designed such that the count of buildings in each score bin decreases monotonically in prevalence at higher scores. This system helps to distinguish differences in scores in both areas of high risk and low risk.

<Figure>
  <CountyMap />
  <FigureCaption number={3}>
    The number of buildings with a risk score of 8 or more (i.e., RPS over 0.5%)
    in each county, representing the burden of at-risk building stock across the
    country. Counts are shown for both current and future climates. When
    shifting from the current to future, spikes both grow and newly appear
    across the western and central U.S., indicating an increasing burden with
    climate change. Counties with fewer than 1,000 buildings meeting the risk
    threshold are masked for clarity.
  </FigureCaption>
</Figure>

## Limitations of our wildfire model

Every climate risk model has limitations, which are typically either acknowledged in scientific literature (as is increasingly standard in the academic community) or revealed behind closed doors to paying clients. In our view, it is important to disclose limitations fully and transparently, both to understand fitness of purpose of datasets for adaptation planning and to inform future model development. We name some limitations here, and also list them as additional factors on the sidebar of the webmap, along with links to additional resources.

First, our fire risk estimates do not account for any building information beyond location. By incorporating the cRPS values from Scott et al. (2024), our RPS estimates account for expected variations in fire intensity across the landscape, and the resultant varying consequence to a hypothetical structure. However, these estimates don’t incorporate any attributes of the specific building, some of which are well-known to dramatically influence the ignition risk of any individual home. Metal roofs, fire-resistant siding and decking, and defensible space are all shown to be effective interventions to help mitigate the risk of ignition. Our model does not account for the effects of any of these factors. While analytics firms and insurance companies may claim to own these datasets, there are currently no publicly available CONUS-wide datasets with this information.

Second, and relatedly, our dataset does not account for any aspect of building-to-building spread, which is a critical factor in urban conflagrations. Once fire enters a community, the effects vary greatly depending on the density of the community. In high-density communities (homes ~6-10 feet apart), if a single home ignites, “the ignition of a structure will almost invariably result in the ignition of one or more adjacent properties and will likely result in the loss of a significant fraction of the community.”<Cite id='maranghides.2022' /> There are a handful of existing models of how fire spreads from home to home. A recently-developed graph-based model is, to our knowledge, the only one that currently includes building-to-building spread in their representation of urban conflagrations.<Cite id='chulahwat.2024' /> However, it requires a rich and detailed dataset of building attributes, and thus has only been applied over a handful of communities where that data was available. As we’ve outlined above, in absence of a CONUS-wide dataset of building attributes, we were unable to implement a building-to-building spread model. Further, this model has only been applied in the context of recreating damage from historical events, and thus does not account for how risk might change in the future. To our knowledge, there is insufficient evidence to develop a statistical model that quantitatively spreads risk within the urban environment. This area of research is ripe for interdisciplinary innovation by climate and fire scientists alike.

Finally, OCR’s wildfire model is based on vegetation data from several years ago, meaning that it does not account for how recent fires would have reduced fuels, lowering risk. To help compensate for this limitation, we have incorporated a satellite layer into the tool, which can help reveal burn scars and explain where risks might not align with intuition.

## How our estimates compare with others

Given the complexity of building a wildfire risk dataset, the choice of risk product could have a large effect on the estimated risk for a given set of buildings. We compare OCR’s wildfire risk estimates to two other public fire risk datasets to understand where they align and diverge: (1) the Scott et al. (2024) dataset that our work builds on; and (2) the Cal Fire Fire Hazard Severity Zones dataset.<Cite id='calfire.2024' /> The first dataset follows methods very similar to ours, with the biggest exception being how risk is spread to developed lands, and the second dataset implements a wind-driven spreading approach that is similar to ours. This comparison assesses risk values at individual buildings — which intentionally focuses the analysis on developed lands, where our methods differ most significantly from Scott et al. (2024).

We find generally good agreement with the Scott et al. dataset, with a few important differences. Across the entire country, the average census-tract level correlation at individual buildings was ~0.64, with an absolute bias of 0.0013% RPS, indicating general agreement. Our higher risk estimates were driven by differences on the east slopes of the Cascades in Washington and Oregon, the mountain foothills in southern California, and the Texas panhandle. From an implementation perspective, areas with lower correlation are places where the choice of a risk dataset has a greater consequence.

<Figure>
 <Table
    columns={6}
    start={[1, 4, 6]}
    width={[3, 1, 1]}
    data={[
      ['Comparison (CONUS-wide)', 'Correlation', 'Bias'],
      ['Scott 2024 vs. CarbonPlan', '0.64', '0.0013%'],
    ]}
    index={false}
    sx={{'& tr:first-of-type td': {
      textTransform: 'uppercase',
      letterSpacing: 'smallcaps',
      fontFamily: 'heading',
      fontSize: [2, 2, 2, 3],
    }}}
  />

  <TableCaption number={2}>
Comparing our estimates of risk to potential structures (RPS) with those from Scott et al. (2024). While our approaches are similar, methodological differences in developed areas are reflected in the correlation and a small bias at the building scale. 
  </TableCaption>
</Figure>

Comparing our data, as well as the data of Scott et al. (2024), to Cal Fire’s dataset is less straightforward for two reasons. First, the Cal Fire estimates are categorical, not continuous values. Second, they are hazard estimates, and so do not assess the level of damage that a fire could cause and therefore should not be understood as a risk score. Nonetheless, the comparison to our risk dataset is warranted because both components of risk — BP and cRPS — relate to fire severity by reflecting the hazard frequency (BP) and intensity (a subcomponent of cRPS) of wildfires.

<Figure>
 <Table
    columns={6}
    start={[1, 5]}
    width={[4, 2]}
    data={[
      ['Comparison (California-wide)', 'Kendall’s Tau'],
      ['Cal Fire vs. CarbonPlan', '0.1'],
      ['Cal Fire vs. Scott 2024', '0.1'],
      ['Scott 2024 vs. CarbonPlan', '0.26'],
    ]}
    index={false}
    sx={{'& tr:first-of-type td': {
      textTransform: 'uppercase',
      letterSpacing: 'smallcaps',
      fontFamily: 'heading',
      fontSize: [2, 2, 2, 3],
    }}}
  />

  <TableCaption number={3}>
 As in Table 1, comparing our estimates with those from Scott et al. (2024) and Cal Fire’s Fire Hazard Severity Zones. Because Cal Fire’s estimates are categorical we use Kendall’s Tau instead of correlation. Our estimates are much more similar to Scott et al. (2024) than either estimate is to Cal Fire’s.
  </TableCaption>
</Figure>

We address these limitations by calculating the Kendall’s Tau for buildings within every census tract in the state, rather than evaluating the correlation. <Sidenote>We used this same test in our [previous climate risk comparisons](https://carbonplan.org/research/climate-risk-comparison).</Sidenote> Kendall’s Tau tests for concordance of data, asking: how similarly do two datasets rank areas on a scale from low to high? In other words, given two locations, do the two datasets agree which is higher or lower on a given scale. Kendall’s Tau ranges from -1 to 1, with 1 indicating perfect concordance and -1 indicating -1 total discordance. In making this comparison, we assume that the Cal Fire hazard scale and the risk to potential structures scale are comparable, and that each scale would similarly arrange low and high numbers. We think this is a reasonable assumption given the similar attributes that each dataset relies upon (e.g., high-resolution vegetation maps, dynamic fire model) and ignores (e.g., building attributes, landscape management).

Overall, the average Kendall’s Tau was ~0.1 for Cal Fire’s hazard layer with both Scott et al. (2024) and our dataset. In contrast, Scott et al. (2024) and our data had much greater concordance, with a statewide average Kendall’s Tau of 0.26. This stronger agreement among datasets can be explained by the similarity in sources and approach between our datasets, while Cal Fire’s estimates come from a wholly different origin.

We also compared our BP data to historical fires using the [Interagency Fire Perimeter History dataset](https://data-nifc.opendata.arcgis.com/datasets/nifc::interagencyfireperimeterhistory-all-years-view/about) from the National Interagency Fire Center. Following Moran et al. (2025), we compared BP distributions in pixels that were previously burned and unburned.<Cite id='moran.2025' /> Across the entire CONUS domain, burned pixels had a higher mean and median BP than unburned pixels, indicating our burn probabilities are generally consistent with the distribution of historical burns. This same finding holds when we repeated the analysis for just the non-wildland pixels where we have altered the original BP values from Riley et al. (2025). Additional information about this benchmarking analysis can be found in our technical documentation.

Our comparison to other data reveals that there can be large and important differences in estimated fire severity and risk across products — especially across major ecological gradients like the eastern rainshadow of the Cascades. We expect that comparisons across more datasets would help us hone in on areas of particular disagreement and develop the research questions to reconcile them.

## What’s next

Fortunately, more data exists on wildfire. Unfortunately, most of it is owned by risk analytics providers that largely keep their data and models private, stymying public comparisons. And yet, a primary way to build confidence in risk estimates is through model intercomparisons. A model that has not been thoroughly evaluated should not be trusted as a basis for decision-making about current and future risk. And whether a model is developed by a nonprofit or a private company, it needs evaluation to improve. It is more efficient for providers to compare their models with those of others, than for each provider to try to develop numerous, distinct models on its own. Because the industry makes only black box models financially viable, it is hard for the public, or even paying customers, to know what evaluation was conducted, or if any was conducted at all.

As we launch Open Climate Risk, one of our hopes is that someone with access to a proprietary wildfire risk model for CONUS will conduct an open comparison with our data, and publish the results. In the United States, we need risk datasets to inform the vast investments we are already engaging in to adapt to climate change, and it is in the public’s interest for those datasets to be open. Our ability to direct our efforts to the places where risk is greatest will only be as good as our predictive models, and opening up those models is a key step.

Most of all, we hope that this free, transparent data will help individuals and communities better understand and plan for the risks they face. We are eager for feedback about what in our platform works well and how we can improve it, and for others to build on our model using our open codebase, whether independently or in collaboration. Fundamentally, we believe climate information is a public good, and see this platform as a step in that direction.

<Endnote label='Credits' divider>

This explainer is in development, and released here as part of a closed beta test of Open Climate Risk. The final published version will differ, and is not yet available for citation.
Oriana Chegwidden wrote the explainer with support from the following team (listed alphabetically): Chris Allen, Tracy Aquino Anderson, Grayson Badgley, Anderson Banihirwe, Jeremy Freeman, Raphael Hagen, Tyler Kukla, Shane Loeffler, Kata Martin. Crystal Raymond of the Western Fire and Forest Resilience Collaborative provided helpful guidance.

</Endnote>

<Endnote label='Terms'>

This work generally generally, and and Figure 3 specifically, is based on analysis that uses information from the [Overture Maps buildings database](https://docs.overturemaps.org/guides/buildings/#14/32.58453/-117.05154/0/60), which is made available here under the [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/).

Article text and Figures 1 and 2 are made available under a [CC-BY 4.0 International license](https://creativecommons.org/licenses/by/4.0/). Figure 3 is made available under an [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/).

</Endnote>
