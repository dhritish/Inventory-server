export const createResponse = () => {
  const response = {
    statusCode: 200,
    payload: undefined,
    cookie: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
    cookie(name, value, options) {
      this.cookie = { name, value, options };
      return this;
    },
  };

  return response;
};
