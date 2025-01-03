const getApiBase = async () => {
  if (process.env.NODE_ENV === "production") {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

export default getApiBase;
