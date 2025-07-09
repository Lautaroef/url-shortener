URL Shortener
Hello fellow recruitee, we need your help! We’ve been tasked to create a URL shortener, and
as a new potential to our team we would like your help to create this application. The task is
simple, we want to be able to create a short link for a given URL.
https://some.place.example.com/foo/bar/biz should be shortened to
https://{domain}/abc123
Mock-up
Here's what the simple interface could look like:
Note: bonus points for creativity on the UI side.
Requirements
● Build a React application that allows you enter a URL
● When the form is submitted, return a shortened version of the URL
● Save a record of the shortened URL to a database
● Ensure the slug of the URL (abc123 in the screenshot above) is unique
● When the shortened URL is accessed, redirect to the stored URL
● If an invalid slug is accessed, display a 404 Not Found page
● You should have a list of all URLs saved in the database
Sr. Backend Test Task v2.1
Extra Credit
● Add support for accounts so people can view the URLs they have created
● Validate the URL provided is an actual URL
● Display an error message if invalid
● Make it easy to copy the shortened URL to the clipboard
● Allow users to modify the slug of their URL
● Track visits to the shortened URL
● Add rate-limiting to prevent bad-actors
● Add a dashboard showing how popular your URLs are
● Build a Docker image of your application
Required Tech
● React w/ typescript for the front end
● Node.JS w/ typescript for the backend
Output format
Please submit the ready task in a format of a github link for a quicker review.
FAQ
● Can I use frameworks
o Yes, it’s encouraged
● Can I use a language other than typescript
o No, we expect the solution to be in typescript only
● What stack do you use internally
o Node.js with NestJS and Postgresql for backend
o React with Next.js for front end
● Should I use an ORM
o If you’d like
● What database should I use
o Any, this is completely up to you
Sr. Backend Test Task v2.1