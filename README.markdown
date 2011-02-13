lunch.js
========

lunch.js is a Node.js application that provides a REST interface for deciding where to go to lunch. Included is a command-line client, `lun.sh`, which uses cURL.

All requests respond to .json, .txt, or the default, .html.

Methods that query already-nominated restaurants (vote and unnominate) can be referred to by prefix. For example, 'chi' matches 'Chick-fil-A'.

All actions except register require a variable 'token' with the user's unique token.

Actions
-------

 * Register
   * /register ?username
   * `lun.sh -n <username> -s <server-with-port>
 * List nominations
   * /nominations
   * `lun.sh` (no parameters)
 * List users
   * /users
 * Nominate a restaurant
   * /nominate ?restaurant
   * `lun.sh -a <restaurant>`
 * Remove a nomination
   * /unnominate ?restaurant
   * `lun.sh -r <restaurant>`
 * Vote for a restaurant
   * /vote ?restaurant
   * `lun.sh <restaurant>`
 * Remove your vote
   * /unvote
   * `lun.sh -u`
 * Mark yourself as a driver
   * /drive ?seats (number of available seats for passengers)
   * `lun.sh -d <seats>`
 * Set your user comment
   * /comment ?comment
   * `lun.sh -c <comment>`
 * Clear your user comment
   * `lun.sh -C`
 * Clear all nominations and votes
   * /reset
   * `lun.sh --reset`

To-Do for Alpha
---------------

 * Make sure no data is leaked through JSON calls

To-Do for Beta
--------------

 * Tab completion for nominations
 * Move authentication token into a cookie
