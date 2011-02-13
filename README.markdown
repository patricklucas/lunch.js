lunch.js
========

lunch.js is a Node.js application that provides a REST interface for deciding where to go to lunch. Included is a command-line client, `lun.sh`, which uses cURL.

All requests respond to .json, .txt, or the default, .html.

Methods that query already-nominated restaurants (vote and unnominate) can be referred to by prefix. For example, 'chi' matches 'Chick-fil-A'.

Actions
-------

 * List nominations
   * GET /nominations
   * `lun.sh` (no parameters)
 * List users
   * GET /users
 * Nominate a restaurant
   * POST /nominate ?restaurant
   * `lun.sh -a <restaurant>`
 * Remove a nomination
   * POST /unnominate ?restaurant
   * `lun.sh -r <restaurant>`
 * Vote for a restaurant
   * POST /vote ?restaurant
   * `lun.sh <restaurant>`
 * Remove your vote
   * POST /unvote
   * `lun.sh -u`
 * Mark yourself as a driver
   * POST /drive ?seats (number of available seats for passengers)
   * `lun.sh -d <seats>`
 * Set your user comment
   * POST /comment ?comment
   * `lun.sh -c <comment>`
 * Clear all nominations and votes
   * POST /reset
   * `lun.sh --reset`

To-Do for Alpha
---------------

 * Tab completion for nominations
