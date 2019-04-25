let {PythonShell} = require('python-shell')

const fastify = require('fastify')({
  logger: true
})

const authenticate = {realm: 'ohohohoh'}
fastify.register(require('fastify-basic-auth'), { validate, authenticate })

async function validate (username, password, req, reply) {
  if (username !== 'yourusername' || password !== 'yourpassword') {
    return new Error('No access, please don\'t try again')
  }
}

fastify.after(() => {
  fastify.addHook('preHandler', fastify.basicAuth)

  fastify.get('/opengate', async (request, reply) => {

    let promise = new Promise((resolve, reject) => {

      PythonShell.run('openme.py', null, function (err,res) {
      if (err){
        resolve({res:err,success:false,time: Date.now()});
      }
        resolve({res:res,success:true,time: Date.now()});
      });

    })

    let result = await promise;

    reply.type('application/json').code(200)
    return result

  })

  fastify.get('/locations', async (request, reply) => {

    let result = {
      "success": true,
      "activateZone" : {
            "P1" : {
              "latitude": 0,
              "longitude": 0
            },
            "P2" : {
              "latitude": 0,
              "longitude": 0
            },
            "P3" : {
              "latitude": 0,
              "longitude": 0
            },
            "P4" : {
              "latitude": 0,
              "longitude": 0
            }
       },
       "safeZone" : {
            "P1" : {
              "latitude": 0,
              "longitude": 0
            },
            "P2" : {
              "latitude": 0,
              "longitude": 0
            },
            "P3" : {
              "latitude": 0,
              "longitude": 0
            },
            "P4" : {
              "latitude": 0,
              "longitude": 0
            }
       },
       "gate" :{
         "latitude": 0,
         "longitude": 0
       }
    }

    reply.type('application/json').code(200)
    return result

  })

})



fastify.listen(3000, (err, address) => {
  if (err) throw err
  fastify.log.info(`server listening on ${address}`)
})
