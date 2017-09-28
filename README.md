# Book-N-Play

A Membership and Events web app where you can sign up as a user and RSVP to available events!

## See a live demo at the link below

http://book-n-play.herokuapp.com/

## Technical Summary

A NodeJS App deployed on Heroku, with Handlebars templating engine for front-end, ExpressJS for back-end and MongoDB with Mongoose ORM as database.

### Salient features include :-

+ Membership workflow
1. Login with authentication using PassportJS
2. Sign up system with email verification (using NodeMailer and email verification npm module)
3. Forgot password/Reset password system by clicking a link sent via email (using NodeMailer)

+ Events workflow
1. Add new event capability for any logged in user
2. Viewing a list of all upcoming events (only available to logged in users)

### More features to be added :-

1. An RSVP system to allow users to signup to any upcoming event
2. Allowing users to view a list of all users who RSVP'd to a given event
3. Adding a comments section for every event, to allow users, RSVP's or not, to discuss about the event
4. UI improvments (showing each event on an individual page, etc.)
