export const DASHBOARD_TYPES = {
  FETCH_JAR_DATA_REQUEST: 'dashboard/fetchJarData/request',
  FETCH_JAR_DATA_SUCCESS: 'dashboard/fetchJarData/success',
  FETCH_JAR_DATA_FAILURE: 'dashboard/fetchJarData/failure',
  CLEAR_ERROR: 'dashboard/clearError',
};

export const JAR_TYPES = {
  NECESSITIES: 'necessities',
  FINANCIAL_FREEDOM: 'financialFreedom',
  LONG_TERM_SAVINGS: 'longTermSavings',
  EDUCATION: 'education',
  PLAY: 'play',
  GIVE: 'give',
};

export const JAR_COLORS = {
  [JAR_TYPES.NECESSITIES]: '#0088FE',
  [JAR_TYPES.FINANCIAL_FREEDOM]: '#00C49F',
  [JAR_TYPES.LONG_TERM_SAVINGS]: '#FFBB28',
  [JAR_TYPES.EDUCATION]: '#FF8042',
  [JAR_TYPES.PLAY]: '#8884D8',
  [JAR_TYPES.GIVE]: '#82CA9D',
};

export const JAR_PERCENTAGES = {
  [JAR_TYPES.NECESSITIES]: 55,
  [JAR_TYPES.FINANCIAL_FREEDOM]: 10,
  [JAR_TYPES.LONG_TERM_SAVINGS]: 10,
  [JAR_TYPES.EDUCATION]: 10,
  [JAR_TYPES.PLAY]: 10,
  [JAR_TYPES.GIVE]: 5,
}; 