const express = require("express");
const router = express.Router();
const { 
  getMessagesByUserId,
  sendMessageIsSuccess,
  checkAuthenticated 
} = require('../utils');

router.get('/', checkAuthenticated, async (req, res) => {
  const  { id } = req.user
  let messages;
  try {
    messages = await getMessagesByUserId(id);
  } catch (err) {
    return
  };
  console.log('line 17' , messages)
  res.render('message', { messages, id });
});

router.post('/', checkAuthenticated, async (req, res) => {
  const { recipient_id, advert_id, is_reply } = req.body;
  const { id } = req.user;
  const content = is_reply ? req.body.reply_content : req.body.content;
  console.log('line 25', content)
  const result = await sendMessageIsSuccess(id, recipient_id, advert_id, content);
  if (!result) {
    req.session.flash.errorMessage = 'Failed to send message';
    res.redirect(`/ads/info?id=${advert_id}`);
    return 
  };
  req.session.flash.successMessage = "Message sent";
  res.redirect(`/ads/info?id=${advert_id}`);
  return
});

module.exports = router;