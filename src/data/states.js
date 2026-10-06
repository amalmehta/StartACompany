// Per-state formation and upkeep data, compiled from public Secretary of State
// fee schedules. Fees change — every number is shown with a link to the
// official source so people can confirm before filing.
//
// llc / corp: state filing fee to form the entity (USD, standard online filing).
// llcAnnual / corpAnnual: recurring state fee in USD (0 = none or free).
// cadence: "annual" | "biennial" | "none" for the recurring report.
// due: when the recurring report is due, in plain words.
// notes: anything unusual worth knowing up front.

export const DATA_REVIEWED = "2026-10-06";

export const STATES = [
  { code: "AL", name: "Alabama", llc: 200, corp: 200, llcAnnual: 50, corpAnnual: 50, cadence: "annual", due: "With the Business Privilege Tax return (by Apr 15 for most)", notes: "Recurring cost is the Business Privilege Tax, minimum $50.", url: "https://www.sos.alabama.gov/business-entities" },
  { code: "AK", name: "Alaska", llc: 250, corp: 250, llcAnnual: 100, corpAnnual: 100, cadence: "biennial", due: "Jan 2 every two years", notes: "Also needs a state business license (~$50/yr).", url: "https://www.commerce.alaska.gov/web/cbpl/Corporations" },
  { code: "AZ", name: "Arizona", llc: 50, corp: 60, llcAnnual: 0, corpAnnual: 45, cadence: "annual", due: "Corporations: on the formation anniversary", notes: "Publication of formation is required outside Maricopa and Pima counties.", url: "https://azcc.gov/divisions/corporations" },
  { code: "AR", name: "Arkansas", llc: 45, corp: 45, llcAnnual: 150, corpAnnual: 150, cadence: "annual", due: "LLCs May 1, corporations May 1", notes: "Recurring cost is the annual franchise tax.", url: "https://www.sos.arkansas.gov/business-commercial-services-bcs" },
  { code: "CA", name: "California", llc: 70, corp: 100, llcAnnual: 810, corpAnnual: 825, cadence: "annual", due: "$800 franchise tax by the 15th day of the 4th month; Statement of Information within 90 days, then every 2 years (LLC, $20) or every year (corporation, $25)", notes: "$800 minimum franchise tax applies every year, even with no revenue. LLCs owe it from year one; new corporations are exempt in their first tax year.", url: "https://bizfileonline.sos.ca.gov" },
  { code: "CO", name: "Colorado", llc: 50, corp: 50, llcAnnual: 25, corpAnnual: 25, cadence: "annual", due: "Within the 5-month window around your formation anniversary", notes: "", url: "https://www.coloradosos.gov/biz" },
  { code: "CT", name: "Connecticut", llc: 120, corp: 250, llcAnnual: 80, corpAnnual: 150, cadence: "annual", due: "LLCs Mar 31; corporations on the formation anniversary month", notes: "Corporation fee includes the minimum organization tax.", url: "https://business.ct.gov" },
  { code: "DE", name: "Delaware", llc: 110, corp: 109, llcAnnual: 300, corpAnnual: 225, cadence: "annual", due: "LLC tax Jun 1; corporation franchise tax + annual report Mar 1", notes: "Default choice for venture-backed startups. Use the Assumed Par Value method for franchise tax or the bill can look like tens of thousands.", url: "https://corp.delaware.gov" },
  { code: "DC", name: "District of Columbia", llc: 99, corp: 99, llcAnnual: 300, corpAnnual: 300, cadence: "biennial", due: "Apr 1 every two years", notes: "A Basic Business License is also needed for most activities.", url: "https://dlcp.dc.gov/service/corporate-registration" },
  { code: "FL", name: "Florida", llc: 125, corp: 70, llcAnnual: 139, corpAnnual: 150, cadence: "annual", due: "Jan 1 – May 1 (a $400 late fee applies after May 1)", notes: "", url: "https://dos.fl.gov/sunbiz/" },
  { code: "GA", name: "Georgia", llc: 100, corp: 100, llcAnnual: 50, corpAnnual: 50, cadence: "annual", due: "Jan 1 – Apr 1", notes: "", url: "https://sos.ga.gov/corporations-division" },
  { code: "HI", name: "Hawaii", llc: 50, corp: 50, llcAnnual: 13, corpAnnual: 13, cadence: "annual", due: "By the end of your formation quarter", notes: "Also register for General Excise Tax (GET) with the state.", url: "https://cca.hawaii.gov/breg/" },
  { code: "ID", name: "Idaho", llc: 100, corp: 100, llcAnnual: 0, corpAnnual: 0, cadence: "annual", due: "By the end of your formation anniversary month", notes: "The annual report is free but required.", url: "https://sos.idaho.gov/business-services/" },
  { code: "IL", name: "Illinois", llc: 150, corp: 150, llcAnnual: 75, corpAnnual: 75, cadence: "annual", due: "Before the first day of your formation anniversary month", notes: "Corporations also pay franchise tax based on paid-in capital.", url: "https://www.ilsos.gov/departments/business_services/" },
  { code: "IN", name: "Indiana", llc: 95, corp: 95, llcAnnual: 32, corpAnnual: 32, cadence: "biennial", due: "By the end of your formation anniversary month, every two years", notes: "", url: "https://inbiz.in.gov" },
  { code: "IA", name: "Iowa", llc: 50, corp: 50, llcAnnual: 30, corpAnnual: 30, cadence: "biennial", due: "Jan 1 – Apr 1 of odd years", notes: "", url: "https://sos.iowa.gov/business/" },
  { code: "KS", name: "Kansas", llc: 160, corp: 90, llcAnnual: 50, corpAnnual: 50, cadence: "annual", due: "15th day of the 4th month after your tax year ends", notes: "", url: "https://sos.ks.gov/businesses/" },
  { code: "KY", name: "Kentucky", llc: 40, corp: 50, llcAnnual: 15, corpAnnual: 15, cadence: "annual", due: "Jan 1 – Jun 30", notes: "", url: "https://www.sos.ky.gov/bus/" },
  { code: "LA", name: "Louisiana", llc: 100, corp: 75, llcAnnual: 30, corpAnnual: 30, cadence: "annual", due: "On your formation anniversary", notes: "", url: "https://www.sos.la.gov/BusinessServices/" },
  { code: "ME", name: "Maine", llc: 175, corp: 145, llcAnnual: 85, corpAnnual: 85, cadence: "annual", due: "Jun 1", notes: "", url: "https://www.maine.gov/sos/cec/corp/" },
  { code: "MD", name: "Maryland", llc: 100, corp: 120, llcAnnual: 300, corpAnnual: 300, cadence: "annual", due: "Apr 15 (Annual Report & Personal Property Return)", notes: "", url: "https://dat.maryland.gov" },
  { code: "MA", name: "Massachusetts", llc: 500, corp: 275, llcAnnual: 500, corpAnnual: 125, cadence: "annual", due: "LLCs on the formation anniversary; corporations 2½ months after the fiscal year ends", notes: "Among the most expensive states for LLCs.", url: "https://www.sec.state.ma.us/divisions/corporations/" },
  { code: "MI", name: "Michigan", llc: 50, corp: 60, llcAnnual: 25, corpAnnual: 25, cadence: "annual", due: "LLCs Feb 15; corporations May 15", notes: "", url: "https://www.michigan.gov/lara/bureau-list/cscl" },
  { code: "MN", name: "Minnesota", llc: 155, corp: 155, llcAnnual: 0, corpAnnual: 0, cadence: "annual", due: "Dec 31", notes: "The annual renewal is free but required, or the state dissolves you.", url: "https://www.sos.state.mn.us/business-liens/" },
  { code: "MS", name: "Mississippi", llc: 50, corp: 50, llcAnnual: 0, corpAnnual: 25, cadence: "annual", due: "Apr 15", notes: "", url: "https://www.sos.ms.gov/business-services" },
  { code: "MO", name: "Missouri", llc: 50, corp: 58, llcAnnual: 0, corpAnnual: 20, cadence: "annual", due: "Corporations: by the end of the anniversary month. LLCs: no annual report.", notes: "", url: "https://www.sos.mo.gov/business" },
  { code: "MT", name: "Montana", llc: 35, corp: 35, llcAnnual: 20, corpAnnual: 20, cadence: "annual", due: "Jan 1 – Apr 15", notes: "", url: "https://sosmt.gov/business/" },
  { code: "NE", name: "Nebraska", llc: 105, corp: 65, llcAnnual: 13, corpAnnual: 26, cadence: "biennial", due: "LLCs Apr 1 of odd years; corporations Mar 1 of even years", notes: "Notice of formation must be published in a local newspaper for 3 weeks.", url: "https://sos.nebraska.gov/business-services" },
  { code: "NV", name: "Nevada", llc: 425, corp: 725, llcAnnual: 350, corpAnnual: 650, cadence: "annual", due: "By the end of your formation anniversary month", notes: "Fees include the required state business license ($200 LLC / $500 corporation).", url: "https://www.nvsilverflume.gov" },
  { code: "NH", name: "New Hampshire", llc: 100, corp: 100, llcAnnual: 100, corpAnnual: 100, cadence: "annual", due: "Jan 1 – Apr 1", notes: "", url: "https://www.sos.nh.gov/corporation-ucc-securities" },
  { code: "NJ", name: "New Jersey", llc: 125, corp: 125, llcAnnual: 75, corpAnnual: 75, cadence: "annual", due: "By the end of your formation anniversary month", notes: "", url: "https://www.njportal.com/DOR/BusinessFormation/" },
  { code: "NM", name: "New Mexico", llc: 50, corp: 100, llcAnnual: 0, corpAnnual: 25, cadence: "biennial", due: "Corporations: 15th day of the 4th month after the fiscal year ends. LLCs: no report.", notes: "", url: "https://www.sos.nm.gov/business-services/" },
  { code: "NY", name: "New York", llc: 200, corp: 125, llcAnnual: 9, corpAnnual: 9, cadence: "biennial", due: "Every two years in the formation anniversary month", notes: "LLCs must publish notice in two newspapers within 120 days. That costs $300–$2,000 depending on the county.", url: "https://dos.ny.gov/corporations-state-records-and-ucc" },
  { code: "NC", name: "North Carolina", llc: 125, corp: 125, llcAnnual: 200, corpAnnual: 25, cadence: "annual", due: "LLCs Apr 15; corporations with the state tax return", notes: "", url: "https://www.sosnc.gov/divisions/business_registration" },
  { code: "ND", name: "North Dakota", llc: 135, corp: 100, llcAnnual: 50, corpAnnual: 25, cadence: "annual", due: "LLCs Nov 15; corporations Aug 1", notes: "", url: "https://firststop.sos.nd.gov" },
  { code: "OH", name: "Ohio", llc: 99, corp: 99, llcAnnual: 0, corpAnnual: 0, cadence: "none", due: "No annual report", notes: "The Commercial Activity Tax applies only above a high gross-receipts threshold.", url: "https://www.ohiosos.gov/businesses/" },
  { code: "OK", name: "Oklahoma", llc: 100, corp: 50, llcAnnual: 25, corpAnnual: 0, cadence: "annual", due: "LLCs on the formation anniversary; corporations with the franchise tax return", notes: "", url: "https://www.sos.ok.gov/business/" },
  { code: "OR", name: "Oregon", llc: 100, corp: 100, llcAnnual: 100, corpAnnual: 100, cadence: "annual", due: "On your formation anniversary", notes: "", url: "https://sos.oregon.gov/business/" },
  { code: "PA", name: "Pennsylvania", llc: 125, corp: 125, llcAnnual: 7, corpAnnual: 7, cadence: "annual", due: "Corporations Jun 30; LLCs Sep 30", notes: "Annual reports have been required since 2025. If you skip three years you are administratively dissolved.", url: "https://www.dos.pa.gov/BusinessCharities/" },
  { code: "RI", name: "Rhode Island", llc: 150, corp: 230, llcAnnual: 50, corpAnnual: 50, cadence: "annual", due: "Feb 1 – May 1", notes: "Also has a $400 minimum business corporation tax.", url: "https://www.sos.ri.gov/divisions/business-services" },
  { code: "SC", name: "South Carolina", llc: 110, corp: 135, llcAnnual: 0, corpAnnual: 25, cadence: "annual", due: "Corporations: with the state income tax return. LLCs: no report.", notes: "", url: "https://sos.sc.gov/online-filings" },
  { code: "SD", name: "South Dakota", llc: 150, corp: 150, llcAnnual: 50, corpAnnual: 50, cadence: "annual", due: "By the first day of the formation anniversary month", notes: "", url: "https://sdsos.gov/business-services/" },
  { code: "TN", name: "Tennessee", llc: 300, corp: 100, llcAnnual: 300, corpAnnual: 20, cadence: "annual", due: "1st day of the 4th month after the fiscal year ends", notes: "LLC fees are $50 per member (minimum $300). There is also a franchise & excise tax.", url: "https://sos.tn.gov/businesses" },
  { code: "TX", name: "Texas", llc: 300, corp: 300, llcAnnual: 0, corpAnnual: 0, cadence: "annual", due: "May 15 (Franchise Tax Report + Public Information Report)", notes: "No franchise tax is due under the no-tax-due revenue threshold, but the reports are still required.", url: "https://www.sos.state.tx.us/corp/" },
  { code: "UT", name: "Utah", llc: 59, corp: 59, llcAnnual: 18, corpAnnual: 18, cadence: "annual", due: "By the end of your formation anniversary month", notes: "", url: "https://corporations.utah.gov" },
  { code: "VT", name: "Vermont", llc: 155, corp: 125, llcAnnual: 35, corpAnnual: 45, cadence: "annual", due: "Within 2½ months after the fiscal year ends", notes: "", url: "https://sos.vermont.gov/corporations/" },
  { code: "VA", name: "Virginia", llc: 100, corp: 75, llcAnnual: 50, corpAnnual: 100, cadence: "annual", due: "By the end of your formation anniversary month", notes: "", url: "https://cis.scc.virginia.gov" },
  { code: "WA", name: "Washington", llc: 200, corp: 200, llcAnnual: 70, corpAnnual: 70, cadence: "annual", due: "By the end of your formation anniversary month", notes: "Formation includes a Business License Application through the state Department of Revenue.", url: "https://www.sos.wa.gov/corporations-charities" },
  { code: "WV", name: "West Virginia", llc: 100, corp: 100, llcAnnual: 25, corpAnnual: 25, cadence: "annual", due: "Jan 1 – Jul 1", notes: "", url: "https://sos.wv.gov/business/" },
  { code: "WI", name: "Wisconsin", llc: 130, corp: 100, llcAnnual: 25, corpAnnual: 25, cadence: "annual", due: "By the end of your formation quarter", notes: "", url: "https://www.wdfi.org/corporations/" },
  { code: "WY", name: "Wyoming", llc: 100, corp: 100, llcAnnual: 60, corpAnnual: 60, cadence: "annual", due: "1st day of the formation anniversary month", notes: "Low fees and strong privacy. Popular for holding companies.", url: "https://sos.wyo.gov/Business/" },
];

export function stateByCode(code) {
  return STATES.find((s) => s.code === code) || null;
}
