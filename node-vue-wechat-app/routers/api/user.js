// @login & register

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

const User = require('../../models/User');

/**
 * router  POST api/users/register
 * desc    注册
 * access  public
 */
router.post('/register', (req, res) => {
  // 查询数据库中邮箱是否已占用
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: '邮箱已被注册' });
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      });
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar,
        password: req.body.password
      });
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

/**
 * router  POST api/users/login
 * desc    登录 返回token jwt passport
 * access  public
 */
router.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // 查询数据库
  User.findOne({ email }).then(user => {
    if (!user) return res.status(404).json({ email: '用户不存在' });

    // 密码匹配
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // jwt.sign('规则', '加密名字', '过期时间', '箭头函数')
        const rule = { id: user.id, name: user.name, avatar: user.avatar };
        jwt.sign(rule, keys.secretOrKey, { expiresIn: 3600 }, (err, token) => {
          if (err) throw err;
          res.json({
            success: true,
            token: 'Bearer ' + token
          });
        });
        // res.json({ msg: 'success' })
      } else return res.status(404).json({ password: '密码错误' });
    });
  });
});

/**
 * router  GET api/users/all
 * desc    获取所有联系人的信息
 * access  Private
 */
router.get(
  '/all',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {};
    User.find()
      .then(users => {
        if (!users) {
          errors.noprofile = '没有任何用户信息';
          return res.status(404).json(errors);
        }
        const newUsers = [];
        for (let i = 0; i < users.length; i++) {
          let usersObj = {};
          usersObj = {
            name: users[i].name,
            _id: users[i]._id,
            email: users[i].email,
            avatar: users[i].avatar,
            date: users[i].date
          };
          newUsers.push(usersObj);
        }

        res.json(newUsers);
      })
      .catch(err => res.status(404).json({ users: '没有任何用户信息' }));
  }
);

/**
 * router  GET api/users/:user_id
 * desc    通过user_id获取个人信息
 * access  Private
 */
router.get(
  '/:user_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {};
    User.findOne({ _id: req.params.user_id })
      .populate('user', ['name', 'avatar'])
      .then(user => {
        if (!user) {
          errors.nouser = '未找到该用户信息';
          res.status(404).json(errors);
        }
        let usersObj = {};
        usersObj = {
          name: user.name,
          _id: user._id,
          email: user.email,
          avatar: user.avatar,
          date: user.date
        };
        res.json(usersObj);
      })
      .catch(err => res.status(404).json(err));
  }
);

module.exports = router;
