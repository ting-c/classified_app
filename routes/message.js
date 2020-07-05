const express = require("express");
const router = express.Router();
const { 
  getMessagesByUserId,
  sendMessageIsSuccess,
  checkAuthenticated,
  toggleMessageIsRead 
} = require('../utils');

router.get('/', checkAuthenticated, async (req, res) => {
  const  { id } = req.user
  let messages;
  try {
    messages = await getMessagesByUserId(id);
  } catch (err) {
    console.log(err)
  };
  const { errorMessage, successMessage } = req.session.flash;
  res.render('message', { messages, id, errorMessage, successMessage });
});

router.post('/', checkAuthenticated, async (req, res) => {
  const { recipient_id, advert_id, is_reply } = req.body;
  const { id } = req.user;
  const content = is_reply === 'true' ? req.body.reply_content : req.body.content;
  try {
    const result = await sendMessageIsSuccess(id, recipient_id, advert_id, content);
    result ? 
      req.session.flash.successMessage = "Message sent" :
      req.session.flash.errorMessage = 'Failed to send message';
    is_reply === 'true' ? 
      res.redirect('/message') :
      res.redirect(`/ads/info?id=${advert_id}`);
  } catch (err) {
    console.log(err)
  }
});

router.post('/read', checkAuthenticated, async (req, res) => {
  const { message_id } = req.body;
  try {
    await toggleMessageIsRead(message_id);
    res.redirect('/message');
  } catch (err) {
    req.session.flash.errorMessage = "Failed to mark message as read";
		res.redirect("/message");
  }
});

module.exports = router;