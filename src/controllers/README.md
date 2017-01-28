# Controllers
#### Implementing a RESTful API

Controllers will typically have 5 functions that follow
the typical CRUD pattern: Create, Read, Update, Destroy.
Our five functions will usually be as follows:
 - **index**: Retrieve all records that match given parameters
 - **show**: Retrieve a single record based on an id parameter
 - **create**: Create a new record with the given data and return it
 - **update**: Update a single record id with the given data
 - **destroy**: Mark a single record id as 'deleted' (this typically amounts to setting an attribute rather than actually deleting the record).

Example Index Function:
```
// req: The incoming request. Params are attached to req.body.param1, req.body.param2, etc
// res: The result object. This is used to return results to the frontend.
exports.index = (req, res) => {
  db.Crime.findAll({
    /* Parameters to filter by */
  }).then((crimes) => {
    /* The 'crimes' object contains the results.
     * Return them to the frontend as follows.
     * /
    res.send(crimes)
  })
}
```
