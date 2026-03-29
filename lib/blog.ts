export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  readingTime: number;
  content: string;
}

const posts: BlogPost[] = [
  {
    slug: "how-to-appeal-property-tax-assessment",
    title: "How to Appeal Your Property Tax Assessment (Step-by-Step Guide)",
    description:
      "Is your property tax bill too high? Up to 60% of properties are over-assessed. Learn exactly how to file a property tax appeal and potentially save thousands.",
    publishedAt: "2024-11-01",
    updatedAt: "2025-01-15",
    category: "Tax Appeals",
    readingTime: 8,
    content: `
<h2>Why You Should Consider Appealing</h2>
<p>Studies consistently show that <strong>30–60% of all properties in the US are over-assessed</strong>, meaning their taxable value is higher than their actual market value. Yet fewer than 5% of homeowners ever challenge their assessment. If your property tax bill feels too high, you're probably right—and the process to appeal is simpler than most people think.</p>
<p>A successful appeal can reduce your annual tax bill by hundreds or even thousands of dollars, permanently, until your next reassessment.</p>

<h2>Step 1: Understand Your Assessment Notice</h2>
<p>Every year (or every few years, depending on your county), you receive a <strong>Notice of Assessment</strong> in the mail. This document shows:</p>
<ul>
  <li><strong>Assessed value</strong> — the taxable value your county assigned to your property</li>
  <li><strong>Market value</strong> — the county's estimate of what your home would sell for</li>
  <li><strong>Appeal deadline</strong> — typically 30–90 days from the notice date</li>
</ul>
<p>Mark the appeal deadline on your calendar immediately. Missing it means waiting another full year.</p>

<h2>Step 2: Gather Your Evidence</h2>
<p>The strongest appeal arguments are based on comparable sales (called "comps"). You need to show the county assessed your home at more than it's worth.</p>
<h3>How to find comps</h3>
<ul>
  <li>Search Zillow, Redfin, or Realtor.com for homes sold in your neighborhood in the last 6–12 months</li>
  <li>Look for homes similar in size (within 10–15%), age, and condition to yours</li>
  <li>If 3–5 comparable homes sold for less than your assessed value, you have a strong case</li>
</ul>
<h3>Other evidence that helps</h3>
<ul>
  <li>A recent appraisal (most compelling but costs $300–500)</li>
  <li>Photos of damage, needed repairs, or deferred maintenance</li>
  <li>Evidence of errors — wrong square footage, extra bedroom the county lists but doesn't exist, etc.</li>
</ul>

<h2>Step 3: File Your Appeal</h2>
<p>Every county has its own process, but the general steps are:</p>
<ol>
  <li>Download the appeal form from your county assessor's website</li>
  <li>Fill it out with your evidence (comps, appraisal, error documentation)</li>
  <li>Submit before the deadline — online, by mail, or in person depending on your county</li>
  <li>Pay any filing fee (usually $0–$50; many counties are free)</li>
</ol>
<p>You can find your county's appeal process by searching "<strong>[your county name] property tax appeal</strong>" — look for the official .gov website.</p>

<h2>Step 4: Attend Your Hearing</h2>
<p>Most appeals result in an informal hearing with a county board member or appraiser. This is not a courtroom — it's a conversation. Tips:</p>
<ul>
  <li>Bring printed copies of all your comps</li>
  <li>Be specific: "Comparable home at 123 Main St sold for $280,000 in August. My assessed value is $315,000."</li>
  <li>Don't argue about the tax rate — only the assessed value is appealable at this stage</li>
  <li>If declined, you can usually escalate to a formal board of review or tax court</li>
</ul>

<h2>What Results Can You Expect?</h2>
<p>Success rates vary widely by county, but homeowners who file appeals with evidence win full or partial reductions <strong>roughly 50–70% of the time</strong>. The average reduction is 10–20% of assessed value.</p>
<p>On a home assessed at $400,000 with a 1.5% tax rate, a 15% reduction saves you <strong>$900 per year</strong> — and the savings compound every year until your next reassessment.</p>

<h2>Informal vs. Formal Appeal</h2>
<table>
  <thead><tr><th>Type</th><th>Timeline</th><th>Cost</th><th>Best For</th></tr></thead>
  <tbody>
    <tr><td>Informal review</td><td>1–4 weeks</td><td>Free</td><td>Clear errors, small overvaluations</td></tr>
    <tr><td>Board of Review</td><td>1–3 months</td><td>$0–$50</td><td>Moderate overassessment with comps</td></tr>
    <tr><td>Tax Court</td><td>6–18 months</td><td>Attorney fees</td><td>Large overassessment ($5,000+ savings)</td></tr>
  </tbody>
</table>

<h2>Consider a Property Tax Consultant</h2>
<p>If your potential savings are over $1,000/year and you don't want to handle it yourself, <strong>property tax consultants</strong> work on contingency — they take 30–50% of your first year's savings, so you pay nothing upfront. For large commercial properties, this is often the best path.</p>

<h2>Key Deadlines by State</h2>
<p>Appeal windows are strict and non-negotiable. Here are deadlines for major states:</p>
<ul>
  <li><strong>California</strong>: July 2 – September 15</li>
  <li><strong>Texas</strong>: May 1 – June 1 (or 30 days after notice)</li>
  <li><strong>New York</strong>: Varies by municipality (usually March–April)</li>
  <li><strong>Florida</strong>: 25 days after the TRIM notice (August–September)</li>
  <li><strong>Illinois</strong>: Varies by county (Cook County: 30 days after assessment)</li>
</ul>
<p>Check your county assessor's website for the exact date in your area.</p>
`,
  },
  {
    slug: "homestead-exemption-complete-guide",
    title: "Homestead Exemption: Complete Guide for All 50 States (2024)",
    description:
      "Homestead exemptions can reduce your property tax bill by thousands. Learn which states offer exemptions, eligibility requirements, and exactly how to apply.",
    publishedAt: "2024-11-15",
    category: "Exemptions",
    readingTime: 7,
    content: `
<h2>What Is a Homestead Exemption?</h2>
<p>A homestead exemption reduces the <strong>taxable value</strong> of your primary residence, which directly lowers your property tax bill. For example, if your home is worth $300,000 and your state has a $50,000 homestead exemption, you only pay taxes on $250,000.</p>
<p>Most states offer some form of homestead protection, but the amount, eligibility rules, and application process vary significantly. Many homeowners who qualify never claim it — simply because they don't know it exists.</p>

<h2>How Much Can You Save?</h2>
<p>Savings depend on your local tax rate and the exemption amount. Here are some real-world examples:</p>
<ul>
  <li><strong>Texas</strong>: $100,000 general homestead exemption. At a 2% rate, that's <strong>$2,000/year saved</strong></li>
  <li><strong>Florida</strong>: Up to $50,000 exemption. At 1% rate, saves <strong>$500/year</strong></li>
  <li><strong>Georgia</strong>: $2,000 state exemption + county exemptions up to $10,000+</li>
  <li><strong>California</strong>: $7,000 exemption (modest — saves roughly $70–$100/year)</li>
</ul>

<h2>Who Qualifies?</h2>
<p>Basic requirements in almost every state:</p>
<ul>
  <li>You own the property</li>
  <li>It is your <strong>primary residence</strong> (you live there)</li>
  <li>You were living there as of a specific date (usually January 1)</li>
</ul>
<p>You <strong>cannot</strong> claim homestead exemption on investment properties, vacation homes, or rental properties.</p>

<h2>Homestead Exemptions by State</h2>
<table>
  <thead><tr><th>State</th><th>Standard Exemption</th><th>Senior Bonus</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Texas</td><td>$100,000</td><td>+$10,000</td><td>Also caps annual increase at 10%</td></tr>
    <tr><td>Florida</td><td>$50,000</td><td>Additional freeze available</td><td>Save Our Homes limits assessment growth</td></tr>
    <tr><td>California</td><td>$7,000</td><td>None additional</td><td>Prop 13 assessment cap is more valuable</td></tr>
    <tr><td>New York</td><td>Varies by county</td><td>Enhanced STAR program</td><td>Basic STAR is automatic for most</td></tr>
    <tr><td>Georgia</td><td>$2,000 + county</td><td>Up to full exemption</td><td>Many counties add large local exemptions</td></tr>
    <tr><td>Illinois</td><td>$10,000</td><td>+$5,000</td><td>Must reapply if you move</td></tr>
    <tr><td>Pennsylvania</td><td>Varies by county</td><td>Special rebate program</td><td>Homestead/farmstead exclusion</td></tr>
    <tr><td>Michigan</td><td>Up to 18 mills waived</td><td>—</td><td>Reduces school operating millage</td></tr>
  </tbody>
</table>

<h2>How to Apply</h2>
<ol>
  <li><strong>Find your county assessor's website</strong> — search "[your county] homestead exemption application"</li>
  <li><strong>Download or request the form</strong> — most counties have it online</li>
  <li><strong>Gather documents</strong>: driver's license (showing your address), property deed, sometimes utility bills</li>
  <li><strong>Submit before the deadline</strong> — usually January 1 – April 30 for the tax year</li>
  <li><strong>It's usually a one-time application</strong> — you don't reapply every year unless you move</li>
</ol>

<h2>Special Exemptions You May Not Know About</h2>
<h3>Senior Citizen Exemptions</h3>
<p>Most states offer enhanced exemptions for seniors (usually 65+), sometimes worth far more than the standard homestead exemption. Texas seniors get an additional $10,000 state exemption plus many local districts add their own.</p>
<h3>Disability Exemptions</h3>
<p>Veterans with service-connected disabilities and homeowners with qualifying disabilities often receive significant additional exemptions, sometimes up to 100% exemption.</p>
<h3>Agricultural Exemptions</h3>
<p>If you have land used for farming or ranching, you may qualify for agricultural (ag) exemption, which can drastically reduce the land's assessed value.</p>

<h2>Assessment Caps: Often Worth More Than Exemptions</h2>
<p>Several states cap how much your assessment can increase each year, which can be more valuable than a flat exemption in appreciating markets:</p>
<ul>
  <li><strong>California Prop 13</strong>: Max 2% annual increase</li>
  <li><strong>Texas</strong>: Max 10% annual increase on homestead properties</li>
  <li><strong>Florida Save Our Homes</strong>: Max 3% or CPI increase</li>
</ul>
<p>If you've owned your home for 10+ years in a hot market, these caps may be saving you more than you realize.</p>
`,
  },
  {
    slug: "how-property-tax-is-calculated",
    title: "How Property Tax Is Calculated: A Complete Breakdown",
    description:
      "Confused by your property tax bill? Learn exactly how assessed value, mill rates, and exemptions combine to produce your annual property tax — with real examples.",
    publishedAt: "2024-10-20",
    category: "How It Works",
    readingTime: 6,
    content: `
<h2>The Basic Formula</h2>
<p>Your property tax bill comes down to one formula:</p>
<p><strong>Property Tax = (Assessed Value − Exemptions) × Tax Rate</strong></p>
<p>Every piece of this formula is set locally — by your county, city, school district, and sometimes special taxing districts. That's why property taxes can vary dramatically between two houses on the same street (if they're in different taxing districts).</p>

<h2>Step 1: Assessed Value</h2>
<p>Your county assessor determines your property's assessed value, which is supposed to reflect its market value. In practice, however, many counties use a different ratio:</p>
<ul>
  <li><strong>100% assessment</strong>: Assessed value = full market value (most common)</li>
  <li><strong>Fractional assessment</strong>: Some states assess at 50%, 40%, or other fractions of market value — but then use a proportionally higher tax rate</li>
</ul>
<p><strong>Example</strong>: A home worth $400,000 in a 100%-assessment state has an assessed value of $400,000. In a state that assesses at 50%, the assessed value is $200,000 — but the tax rate would be roughly double.</p>
<p>Reassessments happen on different schedules: annually in some states, every 3–5 years in others. After a reassessment, your bill can jump significantly even if the tax rate stays the same.</p>

<h2>Step 2: Exemptions</h2>
<p>Before the tax rate is applied, you subtract any exemptions you qualify for. The most common is the homestead exemption for primary residences.</p>
<p><strong>Example</strong>: $400,000 assessed value − $50,000 homestead exemption = $350,000 taxable value.</p>

<h2>Step 3: The Tax Rate (Mill Rate)</h2>
<p>Property tax rates are often expressed in <strong>mills</strong>. One mill = $1 of tax per $1,000 of assessed value, or 0.1%.</p>
<p>Your total tax rate is the sum of all the taxing districts that apply to your property: county, city/municipality, school district, community college, fire district, etc.</p>
<table>
  <thead><tr><th>Taxing District</th><th>Rate (mills)</th></tr></thead>
  <tbody>
    <tr><td>County</td><td>8.5</td></tr>
    <tr><td>School District</td><td>12.0</td></tr>
    <tr><td>City/Municipality</td><td>6.0</td></tr>
    <tr><td>Community College</td><td>1.5</td></tr>
    <tr><td><strong>Total</strong></td><td><strong>28.0 mills (2.8%)</strong></td></tr>
  </tbody>
</table>

<h2>Full Worked Example</h2>
<p>Let's put it all together for a home in a typical midwestern county:</p>
<ul>
  <li>Market value: $350,000</li>
  <li>Assessment ratio: 100%</li>
  <li>Assessed value: $350,000</li>
  <li>Homestead exemption: −$10,000</li>
  <li>Taxable value: $340,000</li>
  <li>Mill rate: 24 mills (2.4%)</li>
  <li><strong>Annual property tax: $340,000 × 0.024 = $8,160</strong></li>
</ul>
<p>Broken down monthly, that's $680 per month — which a lender would add to your mortgage payment as an escrow requirement.</p>

<h2>Effective Tax Rate vs. Nominal Tax Rate</h2>
<p>You'll often see two rates quoted:</p>
<ul>
  <li><strong>Nominal rate</strong>: The stated mill rate applied to assessed value</li>
  <li><strong>Effective rate</strong>: The actual percentage of market value you pay in taxes</li>
</ul>
<p>PropertyTaxPeek uses <strong>effective rates</strong> for all comparisons because they're the most accurate reflection of your real tax burden. A county with a 4% nominal rate on 50%-assessments has a 2% effective rate — the same as a county with a 2% nominal rate on 100%-assessments.</p>

<h2>Why Your Tax Bill Changes Year to Year</h2>
<p>Your bill can change because of:</p>
<ol>
  <li><strong>Reassessment</strong>: Your property value was updated (up or down)</li>
  <li><strong>Rate changes</strong>: Local government approved a higher mill rate</li>
  <li><strong>New levies</strong>: Voters approved a school bond or special district</li>
  <li><strong>Exemption changes</strong>: You gained or lost an exemption (moved, turned 65, etc.)</li>
</ol>

<h2>School District Taxes: The Biggest Slice</h2>
<p>In most counties, <strong>50–70% of your property tax bill goes to schools</strong>. This is why school district boundaries matter so much in real estate. Two homes one street apart in different school districts can have very different tax bills.</p>
`,
  },
  {
    slug: "senior-property-tax-exemptions-guide",
    title: "Senior Property Tax Exemptions: How Seniors Can Save Thousands Per Year",
    description:
      "Most states offer significant property tax breaks for seniors 65+. Learn about senior exemptions, freezes, and deferrals in all 50 states — and how to claim them.",
    publishedAt: "2024-12-01",
    category: "Exemptions",
    readingTime: 7,
    content: `
<h2>The Senior Property Tax Savings Most People Miss</h2>
<p>If you're 65 or older and own your home, there's a good chance you qualify for property tax relief you're not receiving. Studies estimate that <strong>millions of eligible seniors fail to claim available exemptions</strong> each year — simply because they don't know the programs exist or assume they won't qualify.</p>
<p>Depending on your state, these programs can save you anywhere from a few hundred to several thousand dollars annually.</p>

<h2>The Three Types of Senior Tax Relief</h2>

<h3>1. Senior Exemptions</h3>
<p>These reduce your property's <strong>taxable assessed value</strong>, similar to a homestead exemption but available only to seniors. The exemption amount is then multiplied by your tax rate to determine your savings.</p>
<p><strong>Example</strong>: Texas offers an additional $10,000 exemption for homeowners 65+. At a 2% effective rate, that's $200/year additional savings on top of the standard homestead exemption.</p>

<h3>2. Assessment Freezes</h3>
<p>More valuable than a flat exemption in appreciating markets. A freeze locks your <strong>assessed value</strong> at its current level — it can't increase as long as you qualify. This protects seniors on fixed incomes from being taxed out of their homes as property values rise.</p>
<p>States with senior assessment freezes include: Colorado, Connecticut, Illinois, Maryland, Michigan, New Jersey, Oklahoma, South Carolina, and others.</p>

<h3>3. Tax Deferrals</h3>
<p>A deferral doesn't eliminate the tax — it postpones payment until the home is sold or transferred. The deferred taxes accumulate as a lien on the property, typically with low interest (2–6%). This is ideal for seniors with high home equity but limited cash flow.</p>
<p>Deferral programs exist in: California, Colorado, Florida, Iowa, Maine, Massachusetts, Minnesota, Oregon, Texas, Washington, and others.</p>

<h2>Senior Tax Relief by State</h2>
<table>
  <thead><tr><th>State</th><th>Program</th><th>Age Requirement</th><th>Income Limit</th></tr></thead>
  <tbody>
    <tr><td>Texas</td><td>$10,000 extra exemption + freeze option</td><td>65+</td><td>None for exemption</td></tr>
    <tr><td>Florida</td><td>Additional exemption up to $50,000</td><td>65+</td><td>&lt;$34,282</td></tr>
    <tr><td>New York</td><td>Enhanced STAR + Senior Exemption up to 50%</td><td>65+</td><td>&lt;$93,200</td></tr>
    <tr><td>California</td><td>Prop 19 transfer + deferral program</td><td>55+ (transfer), 62+ (deferral)</td><td>Varies</td></tr>
    <tr><td>Illinois</td><td>Senior Citizen Exemption $5,000 + freeze</td><td>65+</td><td>&lt;$65,000 for freeze</td></tr>
    <tr><td>Pennsylvania</td><td>Property Tax/Rent Rebate up to $1,000</td><td>65+</td><td>&lt;$35,000</td></tr>
    <tr><td>New Jersey</td><td>Senior Freeze (assessment freeze)</td><td>65+</td><td>&lt;$150,000</td></tr>
    <tr><td>Colorado</td><td>Senior homestead exemption 50% of first $200K</td><td>65+</td><td>10-year ownership</td></tr>
  </tbody>
</table>

<h2>Veteran and Disability Exemptions</h2>
<p>Seniors who are also veterans or have disabilities often qualify for additional, substantial relief:</p>
<ul>
  <li><strong>100% disabled veterans</strong>: Many states offer complete property tax exemption</li>
  <li><strong>Texas</strong>: 100% disabled veterans pay zero property tax</li>
  <li><strong>Florida</strong>: Disabled veterans with 10%+ disability: additional $5,000 exemption</li>
  <li><strong>California</strong>: Disabled veterans exemption of $161,083–$241,627</li>
</ul>

<h2>Income Limits: Don't Assume You Don't Qualify</h2>
<p>Many senior programs have income limits, but the thresholds are often higher than people expect. New York's Enhanced STAR covers households earning up to $93,200. New Jersey's Senior Freeze covers up to $150,000. Always check — you may be surprised.</p>

<h2>How to Apply for Senior Exemptions</h2>
<ol>
  <li>Contact your <strong>county assessor's office</strong> directly — they can tell you every program available in your county</li>
  <li>Or search "<strong>[your state] senior property tax exemption application</strong>" for the state program</li>
  <li>Most require: proof of age (birth certificate or driver's license), proof of residency, and sometimes income documentation</li>
  <li>Apply by your county's deadline — usually January 1 – April 30 for the current tax year</li>
</ol>
<p>You only need to apply once. The exemption renews automatically unless your circumstances change (you move, income exceeds limits, etc.).</p>

<h2>What If You Already Missed Previous Years?</h2>
<p>Some states allow <strong>retroactive applications</strong> to claim missed exemptions for prior years — usually 1–3 years back. Ask your county assessor specifically about retroactive claims. If eligible, it could mean a significant refund.</p>
`,
  },
  {
    slug: "states-with-lowest-property-taxes",
    title: "10 States With the Lowest Property Taxes (2024 Rankings)",
    description:
      "Looking to minimize your property tax burden? These 10 states have the lowest effective property tax rates in the US. See the data, understand why, and compare.",
    publishedAt: "2024-10-01",
    category: "State Comparisons",
    readingTime: 5,
    content: `
<h2>The Lowest Property Tax States in America</h2>
<p>Property taxes are one of the biggest ongoing costs of homeownership, but they vary enormously across the US. The difference between the highest and lowest-tax states is staggering — a homeowner in New Jersey pays roughly <strong>8x more</strong> in property taxes than a homeowner in Hawaii with the same home value.</p>

<h2>The 10 Lowest Property Tax States</h2>
<table>
  <thead><tr><th>Rank</th><th>State</th><th>Effective Rate</th><th>Median Annual Tax</th><th>Key Reason</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Hawaii</td><td>0.29%</td><td>$1,971</td><td>Low rates offset by high home values</td></tr>
    <tr><td>2</td><td>Alabama</td><td>0.37%</td><td>$609</td><td>Low assessments + numerous exemptions</td></tr>
    <tr><td>3</td><td>Colorado</td><td>0.49%</td><td>$2,017</td><td>Strict assessment limits</td></tr>
    <tr><td>4</td><td>Louisiana</td><td>0.52%</td><td>$983</td><td>Homestead exemption + low assessments</td></tr>
    <tr><td>5</td><td>South Carolina</td><td>0.53%</td><td>$1,024</td><td>Primary residence discount</td></tr>
    <tr><td>6</td><td>West Virginia</td><td>0.55%</td><td>$698</td><td>Low property values statewide</td></tr>
    <tr><td>7</td><td>Wyoming</td><td>0.56%</td><td>$1,380</td><td>Low rates, energy revenues fund government</td></tr>
    <tr><td>8</td><td>Arkansas</td><td>0.61%</td><td>$776</td><td>Low assessments statewide</td></tr>
    <tr><td>9</td><td>Utah</td><td>0.62%</td><td>$2,191</td><td>Strong exemptions for primary residences</td></tr>
    <tr><td>10</td><td>Arizona</td><td>0.63%</td><td>$1,707</td><td>Assessed at 10% of value for residences</td></tr>
  </tbody>
</table>

<h2>Why Do These States Have Low Property Taxes?</h2>
<h3>Alternative Revenue Sources</h3>
<p><strong>Wyoming</strong> funds most of its government through oil, gas, and mineral extraction taxes. <strong>Hawaii</strong> relies heavily on tourism taxes. When states have strong alternative revenue streams, they can afford to keep property tax rates low.</p>
<h3>Constitutional Limits</h3>
<p><strong>Colorado's</strong> Taxpayer's Bill of Rights (TABOR) tightly restricts how much government revenue can grow, keeping rates low. <strong>California's</strong> Proposition 13 caps assessment growth at 2% annually — though it's not in the top 10 overall due to high home values.</p>
<h3>Low Assessment Ratios</h3>
<p><strong>Arizona</strong> assesses residential property at just 10% of market value. <strong>Louisiana</strong> has a $75,000 homestead exemption that effectively eliminates taxes on many modest homes entirely.</p>

<h2>The Hawaii Paradox: Low Rate, High Bill</h2>
<p>Hawaii has the lowest effective tax rate (0.29%) but homeowners still pay nearly $2,000/year on average because home values are extremely high. This illustrates an important point: <strong>tax rate and tax bill are different things</strong>. When comparing states, look at both the rate and the typical dollar amount paid.</p>

<h2>Low-Tax States That Often Get Overlooked</h2>
<p>Beyond the top 10, several states are often underrated for property tax purposes:</p>
<ul>
  <li><strong>Nevada</strong>: 0.55% rate, no state income tax — popular with California refugees</li>
  <li><strong>Idaho</strong>: 0.65% rate with strong homestead exemption, rising popularity</li>
  <li><strong>Tennessee</strong>: No income tax on wages, 0.64% property tax rate</li>
  <li><strong>Florida</strong>: No income tax, 0.86% property tax with Save Our Homes cap</li>
</ul>

<h2>The Trade-Off: Low Property Taxes vs. Other Costs</h2>
<p>Before relocating for low property taxes, consider the full picture:</p>
<ul>
  <li><strong>State income tax</strong>: Texas has no income tax but above-average property taxes</li>
  <li><strong>Sales tax</strong>: Some low-property-tax states compensate with higher sales taxes</li>
  <li><strong>Home prices</strong>: Low-tax states are often experiencing rapid appreciation (Arizona, Utah, Idaho)</li>
  <li><strong>Services quality</strong>: Low property taxes often mean lower school funding and fewer local services</li>
</ul>
<p>Use our <a href="/calculator">property tax calculator</a> and <a href="/compare">state comparison tool</a> to model your actual costs in any state.</p>
`,
  },
  {
    slug: "property-tax-deduction-irs-guide",
    title: "Property Tax Deduction: IRS Rules and How to Maximize It",
    description:
      "The SALT deduction caps your property tax deduction at $10,000. Learn who benefits, how to claim it, and strategies to maximize your deduction under current IRS rules.",
    publishedAt: "2024-11-20",
    category: "Tax Deductions",
    readingTime: 6,
    content: `
<h2>The Federal Property Tax Deduction Explained</h2>
<p>If you itemize deductions on your federal income tax return, you can deduct state and local taxes (SALT) including property taxes. However, the <strong>Tax Cuts and Jobs Act of 2017 capped the SALT deduction at $10,000 per household</strong> ($5,000 for married filing separately).</p>
<p>This cap, which was extended through 2025, significantly reduced the benefit of the property tax deduction for homeowners in high-tax states like New Jersey, New York, California, and Illinois.</p>

<h2>Who Actually Benefits from the Property Tax Deduction?</h2>
<p>To claim the property tax deduction, you must <strong>itemize deductions</strong> instead of taking the standard deduction. For 2024, the standard deduction is:</p>
<ul>
  <li>Single filers: $14,600</li>
  <li>Married filing jointly: $29,200</li>
  <li>Head of household: $21,900</li>
</ul>
<p>You only benefit from itemizing if your total itemized deductions exceed your standard deduction. With the $10,000 SALT cap, homeowners need substantial mortgage interest or charitable contributions to make itemizing worthwhile.</p>

<h2>What Property Taxes Are Deductible?</h2>
<p>You can deduct taxes assessed on real property you own, including:</p>
<ul>
  <li>Primary residence</li>
  <li>Second home or vacation home</li>
  <li>Land you own</li>
</ul>
<p>You <strong>cannot</strong> deduct:</p>
<ul>
  <li>Property taxes included in your escrow account but not yet paid to the taxing authority</li>
  <li>Transfer taxes paid when you bought or sold the home</li>
  <li>Assessments for local improvements (new sidewalk, sewer connection, etc.)</li>
  <li>Fees for services like trash collection or HOA dues</li>
</ul>

<h2>The $10,000 SALT Cap: Real Impact</h2>
<p>Before the 2017 tax reform, high earners in high-tax states could deduct tens of thousands in SALT. Now the cap limits most homeowners. Here's the impact by state:</p>
<table>
  <thead><tr><th>State</th><th>Avg Property Tax</th><th>Deductible Amount</th><th>Cap Impact</th></tr></thead>
  <tbody>
    <tr><td>New Jersey</td><td>~$9,500/year</td><td>Up to $10,000 with state income tax</td><td>Significant — likely at cap</td></tr>
    <tr><td>Texas</td><td>~$5,000/year</td><td>Full amount if no state income tax space</td><td>May have room under cap</td></tr>
    <tr><td>California</td><td>~$4,500/year</td><td>~$4,500 property + state income tax up to $5,500</td><td>Cap usually reached</td></tr>
    <tr><td>Florida</td><td>~$2,200/year</td><td>Full $2,200 (no state income tax)</td><td>Well under cap</td></tr>
  </tbody>
</table>

<h2>Rental Property: Different Rules (Better Deduction)</h2>
<p>If you own <strong>rental property</strong>, the rules are much more favorable. Property taxes on rental properties are a <strong>business expense</strong> deductible on Schedule E, not Schedule A. This means:</p>
<ul>
  <li>No $10,000 SALT cap — full deduction regardless of amount</li>
  <li>Deducted as a business expense, reducing your net rental income</li>
  <li>Still deductible even if you take the standard deduction</li>
</ul>

<h2>Strategies to Maximize Your Deduction</h2>
<h3>Bunch Your Deductions</h3>
<p>If you're close to the threshold between standard and itemized, consider paying two years of property taxes in one calendar year (prepay next year's bill in December). This bunches deductions into one tax year, letting you itemize that year and take the standard deduction the next.</p>
<p>Note: You can only deduct property taxes in the year you actually pay them, and you cannot prepay taxes for future years if the tax hasn't been assessed yet.</p>
<h3>Track All Deductible Taxes</h3>
<p>Count both property taxes and state income taxes (or sales taxes) together toward your $10,000 cap. In states with no income tax (Texas, Florida, Nevada), you have more room for property taxes under the cap.</p>
<h3>Consider a Qualified Opportunity Zone</h3>
<p>If you're in a high-tax area and considering moving to a lower-tax state, the math may favor the move. Our <a href="/compare">state comparison tool</a> can show you the difference.</p>

<h2>SALT Cap Expiration: What's Coming?</h2>
<p>The $10,000 SALT cap is currently set to expire after 2025. If Congress allows it to expire, the deduction would return to unlimited (subject only to AMT). If it's extended or made permanent, the current cap remains. This is an active area of tax policy debate — particularly for Representatives from high-tax states.</p>
`,
  },
  {
    slug: "new-jersey-highest-property-taxes-explained",
    title: "Why New Jersey Has the Highest Property Taxes in America",
    description:
      "New Jersey homeowners pay the highest property taxes in the US at 2.23% average. Here's why — and what NJ homeowners can do to reduce their bills.",
    publishedAt: "2024-09-15",
    category: "State Spotlights",
    readingTime: 6,
    content: `
<h2>The Numbers: Just How High Are NJ Property Taxes?</h2>
<p>New Jersey consistently ranks as the state with the <strong>highest effective property tax rate</strong> in the United States, typically around 2.13–2.23%. The average NJ homeowner pays approximately <strong>$9,500 per year</strong> in property taxes — nearly triple the national average.</p>
<p>In some affluent Bergen County suburbs, effective rates can reach 3% or higher, meaning a $1 million home generates $30,000+ in annual tax bills.</p>

<h2>Why Is New Jersey's Property Tax So High?</h2>

<h3>1. Heavy Reliance on Property Taxes for Schools</h3>
<p>New Jersey funds its public schools primarily through local property taxes. Unlike many states that fund schools through a larger statewide mechanism, NJ school districts depend heavily on local tax revenue. With some of the highest-ranked public schools in the country, residents are paying for that quality — directly through their property tax bills.</p>
<p>School taxes typically represent <strong>60–65% of the total property tax bill</strong> in most NJ municipalities.</p>

<h3>2. Fragmented Local Government</h3>
<p>New Jersey has <strong>564 municipalities</strong> in just 8,723 square miles — the most dense local government structure in the US. Each municipality maintains its own government, police force, public works, and administration. This duplication creates enormous overhead that must be funded through property taxes.</p>

<h3>3. High Cost of Living and Services</h3>
<p>NJ is among the most expensive states to operate government. Public employee salaries and pension obligations are high. Infrastructure maintenance costs more. These costs are ultimately passed to taxpayers.</p>

<h3>4. No Broad-Based Revenue Alternative</h3>
<p>Unlike Wyoming (mineral extraction) or Nevada (gaming/tourism), New Jersey doesn't have a natural revenue windfall. It relies on a combination of property taxes, income tax, and sales tax — and property taxes bear a disproportionate share.</p>

<h2>How NJ Compares to Its Neighbors</h2>
<table>
  <thead><tr><th>State</th><th>Effective Rate</th><th>Avg Annual Tax</th></tr></thead>
  <tbody>
    <tr><td>New Jersey</td><td>2.23%</td><td>$9,476</td></tr>
    <tr><td>New York</td><td>1.73%</td><td>$5,884</td></tr>
    <tr><td>Connecticut</td><td>1.79%</td><td>$6,153</td></tr>
    <tr><td>Pennsylvania</td><td>1.53%</td><td>$3,442</td></tr>
    <tr><td>Delaware</td><td>0.57%</td><td>$1,431</td></tr>
  </tbody>
</table>
<p>Delaware's dramatically lower rate is one reason many NJ residents relocate there at retirement.</p>

<h2>What NJ Homeowners Can Do to Reduce Their Bills</h2>

<h3>ANCHOR Program (formerly Homestead Benefit)</h3>
<p>The Affordable New Jersey Communities for Homeowners and Renters (ANCHOR) program provides property tax relief:</p>
<ul>
  <li>Homeowners earning up to $150,000: $1,500 benefit</li>
  <li>Homeowners earning $150,001–$250,000: $1,000 benefit</li>
  <li>Renters earning up to $150,000: $450 benefit</li>
</ul>
<p>This doesn't reduce your tax bill directly — it's paid as a credit. Apply at the NJ Division of Taxation website.</p>

<h3>Senior Freeze (Property Tax Reimbursement)</h3>
<p>For residents 65+ with income under $150,000 who have lived in NJ for 10+ years, the Senior Freeze reimburses the difference between your current property taxes and what you paid in your base year. This can mean thousands of dollars annually for long-time residents on fixed incomes.</p>

<h3>Appeal Your Assessment</h3>
<p>NJ has one of the highest rates of successful property tax appeals in the country. Appeals are filed with the county Tax Board (for assessments under $1M) or the Tax Court of NJ (over $1M).</p>
<p>The deadline is typically <strong>April 1</strong> (or 45 days after mailing of assessment notices). With median assessments often inflated in rising markets, a professional appeal can frequently yield 10–20% reductions.</p>

<h3>Veteran and Disability Exemptions</h3>
<ul>
  <li>Veterans (honorable discharge): $250 annual deduction</li>
  <li>Totally disabled veterans: 100% exemption</li>
  <li>Totally disabled civilians: 100% exemption (must be unable to be gainfully employed)</li>
  <li>Surviving spouse of eligible veteran: continued eligibility</li>
</ul>

<h2>Is Reform Coming?</h2>
<p>Property tax reform is a perennial issue in NJ politics, but structural changes are difficult. Consolidating municipalities (reducing 564 to fewer), regional school districts, and school funding reform are frequently discussed but face strong local opposition. Most reform proposals focus on relief programs (like ANCHOR) rather than structural tax reduction.</p>
`,
  },
  {
    slug: "first-time-homebuyer-property-tax-guide",
    title: "First-Time Homebuyer's Complete Guide to Property Taxes",
    description:
      "Buying your first home? Property taxes are one of the biggest costs most buyers underestimate. Here's everything you need to know before and after you close.",
    publishedAt: "2024-12-15",
    category: "Homebuyer Guides",
    readingTime: 7,
    content: `
<h2>Why Property Taxes Matter More Than Most Buyers Realize</h2>
<p>When shopping for a home, most buyers focus on the purchase price and mortgage rate. Property taxes, however, can add <strong>$200 to $2,000+ to your monthly housing cost</strong> — a significant factor that can make or break affordability.</p>
<p>A $400,000 home in Texas might have a $9,000/year tax bill ($750/month), while the same-priced home in Alabama might cost just $1,500/year ($125/month). That $625/month difference is equivalent to a major mortgage rate difference.</p>

<h2>How Property Taxes Work in Your Mortgage</h2>
<p>Most lenders require you to pay property taxes through an <strong>escrow account</strong>. Here's how it works:</p>
<ol>
  <li>Your lender estimates your annual property tax</li>
  <li>Divides it by 12 and adds it to your monthly mortgage payment</li>
  <li>Holds the funds in escrow</li>
  <li>Pays the tax authority directly when taxes are due</li>
</ol>
<p>This means your quoted "monthly mortgage payment" typically includes PITI: <strong>Principal, Interest, Taxes, and Insurance</strong>. Always clarify whether a quoted payment includes taxes.</p>

<h2>What to Research Before You Buy</h2>
<h3>Verify the Current Tax Bill</h3>
<p>Ask the seller for the most recent property tax statement. Don't rely on Zillow or Redfin estimates — they're often wrong, especially after recent sales or reassessments.</p>
<h3>Understand the Assessment Cycle</h3>
<p>In many states, property is reassessed when it sells. If you buy a home that was assessed years ago at a lower value, <strong>your assessment (and tax bill) may jump significantly</strong> after your purchase. Common in:</p>
<ul>
  <li>California (Prop 13 resets on sale — your new assessment = purchase price)</li>
  <li>Michigan (assessment can jump to market value at time of sale)</li>
  <li>Many other states with fractional assessment systems</li>
</ul>
<h3>Check for Pending Assessments or Tax Increases</h3>
<p>Ask your real estate agent and check with the county assessor about:</p>
<ul>
  <li>Any scheduled reassessments in the area</li>
  <li>Upcoming bond measures or levy increases on the ballot</li>
  <li>Recent sales of comparable properties (which may trigger reassessments)</li>
</ul>

<h2>Using the Effective Tax Rate to Compare Homes</h2>
<p>When comparing homes in different areas, calculate the effective tax rate to compare apples to apples:</p>
<p><strong>Effective Rate = Annual Tax ÷ Home Value</strong></p>
<p>If House A costs $400,000 and pays $6,000/year in taxes (1.5%), and House B costs $380,000 and pays $8,000/year (2.1%), House B actually costs more to own on a tax basis even though its price is lower.</p>

<h2>Applying for Your Homestead Exemption</h2>
<p>This is the step most first-time buyers miss. After closing, you must apply for a homestead exemption to get the lower primary-residence tax rate. <strong>This does not happen automatically</strong>.</p>
<p>Typical process:</p>
<ol>
  <li>Wait until after your closing date</li>
  <li>Contact your county assessor's office (or go to their website)</li>
  <li>Download the homestead exemption application</li>
  <li>Submit with your deed and proof of residency (driver's license showing new address)</li>
  <li>Deadline is usually January 1 – April 30 of the tax year</li>
</ol>
<p>Depending on your state and county, this can save you <strong>$500 to $2,000+ per year</strong>. Don't miss it.</p>

<h2>Your First-Year Tax Bill: What to Expect</h2>
<p>Property taxes are typically due once or twice a year (depending on the state). Common schedules:</p>
<ul>
  <li><strong>April and October</strong>: Texas, California</li>
  <li><strong>February and August</strong>: Florida, Georgia</li>
  <li><strong>January (full year)</strong>: Many counties in the Northeast</li>
</ul>
<p>If you closed mid-year, the seller typically pays taxes up to the closing date and you pay the remainder. This is handled at closing through prorated credits.</p>

<h2>Prorations at Closing: A Real Example</h2>
<p>Suppose you close on July 1. Annual property taxes are $6,000.</p>
<ul>
  <li>Seller owned January 1 – June 30 (181 days): owes $2,983</li>
  <li>You own July 1 – December 31 (184 days): owe $3,017</li>
</ul>
<p>The seller typically credits you $2,983 at closing (they've already paid or owe this amount). You'll then pay the full $6,000 bill when it comes due in the fall.</p>
<p>Ask your title company for the exact proration calculation — it varies by state and local custom.</p>

<h2>Estimating Future Tax Bills</h2>
<p>Use our <a href="/calculator">property tax calculator</a> to estimate your taxes in any state. For your specific county, look up the current mill rate from your county assessor and apply it to your purchase price (in states that reassess on sale) or the existing assessed value.</p>

<h2>Tax Benefits of Homeownership</h2>
<p>Once you own, you gain access to tax benefits that renters don't have:</p>
<ul>
  <li><strong>Property tax deduction</strong> (up to $10,000 SALT cap if you itemize)</li>
  <li><strong>Mortgage interest deduction</strong> on the first $750,000 of debt</li>
  <li><strong>Capital gains exclusion</strong>: Up to $250,000 ($500,000 married) tax-free profit on sale after 2 years of residence</li>
</ul>
`,
  },
  {
    slug: "texas-property-tax-complete-guide",
    title: "Texas Property Tax: Complete Guide for 2024",
    description:
      "Texas has no state income tax but some of the highest property taxes in the US. Learn how Texas property taxes work, exemptions available, and how to appeal your bill.",
    publishedAt: "2024-10-10",
    category: "State Spotlights",
    readingTime: 8,
    content: `
<h2>The Texas Property Tax Reality</h2>
<p>Texas is famous for having no state income tax, but there's a significant trade-off: <strong>Texas homeowners pay some of the highest property taxes in the nation</strong>, with an effective rate averaging around 1.60–1.80% — compared to the national average of about 1.08%.</p>
<p>For a $400,000 home, that's roughly $6,400–$7,200 per year — or $533–$600 per month added to your housing costs.</p>

<h2>How Texas Property Taxes Work</h2>
<p>Texas has no statewide property tax. All property taxes are levied by <strong>local taxing units</strong>:</p>
<ul>
  <li>School districts (typically the largest portion — 40–60% of total bill)</li>
  <li>County</li>
  <li>City/municipality</li>
  <li>Special districts (water, hospital, community college, etc.)</li>
</ul>
<p>Each property in Texas may be taxed by multiple overlapping entities. The combined rate in many major metro areas is between 2.0–2.5%.</p>

<h2>Texas Property Tax Exemptions</h2>
<h3>General Homestead Exemption</h3>
<p>Texas law requires school districts to provide a <strong>$100,000 homestead exemption</strong> (raised from $40,000 in 2023). This is mandatory statewide. At a 1.5% school tax rate, this alone saves $1,500/year.</p>
<p>Cities, counties, and other taxing units may offer additional optional exemptions (typically $5,000–$25,000).</p>
<h3>Senior (65+) and Disabled Person Exemption</h3>
<ul>
  <li>Additional $10,000 exemption on school district taxes</li>
  <li>School tax <strong>frozen</strong> at the amount paid when you turned 65 or became disabled — it cannot increase as long as you own the home</li>
  <li>Many counties and cities also freeze their portion for seniors</li>
</ul>
<h3>100% Disabled Veteran Exemption</h3>
<p>Texas veterans with a 100% VA disability rating pay <strong>zero property tax</strong> on their homestead. This is one of the most generous veteran benefits in the country.</p>
<p>Partial disability ratings also qualify for partial exemptions (10% = $5,000, 70% = $12,000, etc.).</p>

<h2>Assessment Caps: The 10% Rule</h2>
<p>For homestead properties, the <strong>assessed value cannot increase more than 10% per year</strong>, regardless of how much the market value increases. This is a significant protection in Texas's hot real estate markets (Austin, Dallas, Houston areas).</p>
<p>Note: The cap applies to assessed value, not market value. If your home's market value jumps 30% in a year, the county's appraised value can still increase by a maximum of 10%.</p>
<p>Non-homestead properties (rentals, commercial, second homes) do not have the 10% cap.</p>

<h2>How to Protest Your Texas Property Tax</h2>
<p>Texas homeowners have the right to protest their appraisal every year. The process is handled by each county's <strong>Appraisal Review Board (ARB)</strong>.</p>
<h3>Protest deadline</h3>
<p>Typically <strong>May 15</strong>, or 30 days after you receive your appraisal notice (whichever is later). Check your county appraisal district's website for the exact date.</p>
<h3>How to file</h3>
<ol>
  <li>Go to your county appraisal district's website (e.g., HCAD for Harris County, DCAD for Dallas, TCAD for Travis/Austin)</li>
  <li>File online, by mail, or in person using Form 50-132</li>
  <li>The most common ground for protest: "Value is over market value" or "Unequal appraisal"</li>
</ol>
<h3>Evidence to bring</h3>
<ul>
  <li>Recent sales of comparable homes in your neighborhood (comps)</li>
  <li>Evidence of needed repairs or condition issues</li>
  <li>The county's own data — if similar homes are appraised lower, you have an "unequal appraisal" case</li>
</ul>
<p>The ARB process is informal — many protests are resolved in an informal meeting before a formal hearing. Success rates in Texas are among the highest in the nation: many counties see 40–60% of protests result in reductions.</p>

<h2>Texas Property Tax Due Dates</h2>
<ul>
  <li><strong>January 1</strong>: Appraisal date (value is set as of this date)</li>
  <li><strong>April 1 – May 15</strong>: Appraisal notices mailed</li>
  <li><strong>May 15</strong>: Protest deadline (or 30 days after notice)</li>
  <li><strong>October 1</strong>: Tax bills mailed</li>
  <li><strong>January 31</strong>: Payment deadline (without penalty)</li>
</ul>
<p>Late payments incur a 6% penalty in February, plus 1% per month after that, plus interest.</p>

<h2>Property Tax Relief Programs in Texas</h2>
<h3>Installment Payment Plans</h3>
<p>If you can't pay in full, Texas law allows installment payments — but only if you're over 65, disabled, or have a certain percentage VA disability. Others must pay in full by January 31.</p>
<h3>Deferral for Seniors</h3>
<p>Homeowners 65+ can defer all property taxes until the home is sold or transferred. Deferred taxes accrue at 5% annual interest. This prevents tax-related foreclosure for seniors on fixed incomes.</p>
`,
  },
  {
    slug: "california-property-tax-proposition-13-guide",
    title: "California Property Tax & Proposition 13: What Every Homeowner Needs to Know",
    description:
      "California's Prop 13 creates unique property tax rules that can mean dramatically different bills for neighbors in identical homes. Here's how the system works.",
    publishedAt: "2024-09-01",
    category: "State Spotlights",
    readingTime: 7,
    content: `
<h2>Why California Property Taxes Are Unusual</h2>
<p>California has a property tax paradox: the state has one of the highest home values in the nation, but a relatively modest effective tax rate of around 0.73%. This is largely due to <strong>Proposition 13</strong>, passed in 1978, which fundamentally changed how California assesses property taxes.</p>

<h2>Proposition 13: The Basics</h2>
<p>Prop 13 does two key things:</p>
<ol>
  <li><strong>Caps the tax rate</strong> at 1% of assessed value (plus local bonds and assessments, which typically add 0.2–0.5%)</li>
  <li><strong>Limits annual assessment increases</strong> to a maximum of 2% per year (or the rate of inflation, whichever is lower)</li>
</ol>
<p>The assessed value is reset to the market value only when the property is sold or newly constructed. This means long-term owners can pay taxes on a value that is far below current market value.</p>

<h2>The Neighbor Effect: Same House, Very Different Bills</h2>
<p>The result of Prop 13 is dramatic inequity between neighbors:</p>
<p><strong>Example in the Bay Area</strong>:</p>
<ul>
  <li>Neighbor A bought in 1985 for $150,000. Current assessed value: ~$240,000 (after 2%/year increases). Tax bill: ~$2,700/year</li>
  <li>Neighbor B bought in 2022 for $1,500,000. Assessed value: $1,500,000. Tax bill: ~$16,500/year</li>
</ul>
<p>Same neighborhood, same house size — but one pays 6x more in property taxes.</p>

<h2>Proposition 19 (2020): What Changed</h2>
<p>Proposition 19, passed in November 2020 and effective February 2021, made significant changes to Prop 13's transfer rules:</p>
<h3>What Prop 19 Expanded</h3>
<ul>
  <li>Homeowners 55+, severely disabled, or natural disaster victims can transfer their Prop 13 base year value to a new home anywhere in California (previously limited to same or lower-value property in the same county)</li>
  <li>Available up to <strong>three times in a lifetime</strong></li>
</ul>
<h3>What Prop 19 Restricted</h3>
<ul>
  <li>Eliminated the parent-to-child transfer exclusion for most properties</li>
  <li>Previously, children could inherit a property without a reassessment — even if they didn't live in it</li>
  <li>Now, the inherited property is reassessed unless the child makes it their primary residence within one year (and the value benefit is capped)</li>
</ul>

<h2>California Property Tax Exemptions</h2>
<h3>Homeowner's Exemption</h3>
<p>A modest $7,000 reduction in assessed value for primary residences. Saves approximately $70–$100/year. Must be applied for after purchase — it's not automatic.</p>
<h3>Disabled Veterans Exemption</h3>
<ul>
  <li>Basic exemption: $161,083 in assessed value (2024)</li>
  <li>Low-income exemption: $241,627 in assessed value (2024)</li>
  <li>Must be honorably discharged with at least 40% disability</li>
</ul>
<h3>Senior Citizens Property Tax Postponement</h3>
<p>Seniors 62+ with income under $53,574 can defer their property taxes until the home is sold. The state pays your taxes and places a lien at 7% annual interest. <a href="https://www.sco.ca.gov/ardtax_prop_tax_postponement.html" target="_blank" rel="noopener">Apply through the State Controller's Office.</a></p>

<h2>Supplemental Property Tax Bill</h2>
<p>When you buy a California home, you'll receive a <strong>supplemental tax bill</strong> within a few months of closing. This covers the difference between the previous owner's assessed value and your new purchase price, prorated for the remainder of the tax year.</p>
<p>This bill catches many new buyers off guard — it's in addition to your regular annual bill. Budget for it in advance.</p>

<h2>How to Reduce Your California Property Tax</h2>
<ol>
  <li><strong>Apply for the homeowner's exemption</strong> — file with your county assessor within 30 days of purchase</li>
  <li><strong>Appeal if your purchase price doesn't reflect market value</strong> — if you paid above market value or the property has issues, you can appeal. California allows appeals for errors in assessment, declining market value, or calamity damage.</li>
  <li><strong>Take advantage of Prop 19 portability</strong> — if you're 55+ and plan to move, transferring your low base year value can save substantial taxes on your next home</li>
  <li><strong>Check disaster relief</strong> — after a calamity (fire, earthquake, flood), you can apply for a temporary assessment reduction</li>
</ol>

<h2>Understanding Your California Property Tax Bill</h2>
<p>Your California property tax bill has two components:</p>
<ul>
  <li><strong>1% base rate</strong>: The core Prop 13 rate on your assessed value</li>
  <li><strong>Direct charges and voter-approved bonds</strong>: These can add 0.2–0.8% in many Bay Area and LA area counties</li>
</ul>
<p>Your total effective rate in California typically falls between 1.0–1.3% of assessed value. Effective rate on <em>market value</em> is much lower due to Prop 13 assessment limits on long-term owners.</p>
`,
  },
];

export function getAllPosts(): BlogPost[] {
  return posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return posts.filter((p) => p.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(posts.map((p) => p.category))];
}
