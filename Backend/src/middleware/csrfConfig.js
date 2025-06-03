import csrf from 'csurf';

const csrfProtection = csrf({
  value: (req) => req.headers['x-csrf-token']
});

export default csrfProtection;