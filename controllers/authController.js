import { userModel } from "../models/userModel.js";


export const loginPage = (req, res) => {
  res.render('auth/login', { layout:false ,pageTitle: 'Login' });
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  const user = await userModel.findByUsername(username);

  if (!user) {
    return res.render('auth/login', { layout:false, pageTitle: 'Login', error: 'Invalid username or password.' });
  }

  const valid = await userModel.verifyPassword(password, user.password);
  if (!valid) {
    return res.render('auth/login', { layout:false, pageTitle: 'Login', error: 'Invalid username or password.' });
  }

  // Set session
  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.username = user.username;

if(user && valid){
  res.redirect('/');
}
};

export const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};