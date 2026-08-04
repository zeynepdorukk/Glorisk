/**
 * Works this project leans on or answers to. Every DOI has been resolved; the
 * two journal articles are cited with the issue they appeared in.
 */
export const LITERATURE = [
  {
    id: 'kkm2010',
    authors: 'Kaufmann, D., Kraay, A. & Mastruzzi, M.',
    year: 2010,
    title: 'The Worldwide Governance Indicators: Methodology and Analytical Issues',
    venue: 'World Bank Policy Research Working Paper 5430',
    doi: '10.1596/1813-9450-5430',
    role: 'How the governance inputs are built: an unobserved components model that pools dozens of underlying sources into six aggregate measures.',
  },
  {
    id: 'langbein2010',
    authors: 'Langbein, L. & Knack, S.',
    year: 2010,
    title: 'The Worldwide Governance Indicators: Six, One, or None?',
    venue: 'Journal of Development Studies 46(2), 350–370',
    doi: '10.1080/00220380902952399',
    role: 'Argues the six WGI measures are not empirically distinct and largely reflect a single dimension. The redundancy diagnostic here reproduces that on current data, at a mean pairwise r of 0.82.',
  },
  {
    id: 'thomas2010',
    authors: 'Thomas, M. A.',
    year: 2010,
    title: 'What Do the Worldwide Governance Indicators Measure?',
    venue: 'The European Journal of Development Research 22(1), 31–54',
    doi: '10.1057/ejdr.2009.32',
    role: 'Questions whether the WGI have established construct validity — whether they measure the concepts they are named after. The external checks in Findings are the response available to a project like this one.',
  },
  {
    id: 'oman2006',
    authors: 'Oman, C. & Arndt, C.',
    year: 2006,
    title: 'Uses and Abuses of Governance Indicators',
    venue: 'OECD Development Centre Studies',
    doi: '10.1787/9789264026865-en',
    role: 'On perception bias and on treating governance indicators as comparable over time. It is why trajectories here are read as movement within a fixed reference distribution rather than as precise year-on-year change.',
  },
  {
    id: 'oecd2008',
    authors: 'OECD & Joint Research Centre',
    year: 2008,
    title: 'Handbook on Constructing Composite Indicators: Methodology and User Guide',
    venue: 'OECD',
    doi: '10.1787/9789264043466-en',
    role: 'The reference for the construction steps used here: normalisation, equal weighting where no basis for anything else exists, and publishing an uncertainty and sensitivity analysis alongside the index.',
  },
];

export const doiUrl = (doi) => `https://doi.org/${doi}`;
