lunch.js
========

lunch.js is a Node.js application that provides a REST interface for deciding where to go to lunch. Included is a command-line client, `lun.sh`, which uses cURL.

All requests respond to .json, .txt, or the default, .html.

Actions
-------

 * List nominations
   * GET /nominations
   * `lun.sh` (no parameters)
 * List users
   * GET /users
 * Nominate a restaurant
   * POST /nominate ?nomination (the restaurant to nominate)
   * `lun.sh -a <restaurant>`
 * Remove a nomination
   * POST /unnominate ?nomination
   * `lun.sh -r <restaurant>`
 * Vote for a restaurant
   * POST /vote ?restaurant (the prefix of the restaurant, eg. 'chi' matches 'Chick-fil-A')
   * `lun.sh <restaurant-prefix>`
 * Remove your vote
   * POST /unvote
   * `lun.sh -u`
 * Mark yourself as a driver
   * POST /drive ?seats (number of available seats for passengers)
   * `lun.sh -d <seats>`
 * Set your user comment
   * POST /comment ?comment
   * `lun.sh -c <comment>`
 * Reset the list of nominations
   * POST /reset
   * `lun.sh --reset`

To-Do for Alpha
---------------

 * User authentication
 * Show drivers
