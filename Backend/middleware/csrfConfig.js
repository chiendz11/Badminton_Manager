import csrf from 'csurf';

const csrfProtection = csrf({
  cookie: true,
  value: (req) => req.headers['x-csrf-token']
});

export default csrfProtection;