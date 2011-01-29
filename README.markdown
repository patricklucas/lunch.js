lunch.js
========

lunch.js is a Node.js application that provides a REST interface for deciding where to go to lunch. Included is a command-line client, `lun.sh`, which uses cURL.

Current functionality is limited to listing users (of which none can be added), listing nominations, and nominating restaurants.

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
   * `lun.sh -a Some Restaurant`
 * Mark yourself as a driver
   * POST /drive ?seats (number of available seats for passengers)
 * Reset the list of nominations
   * POST /reset
   * `lun.sh --reset`
