const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CareConnect API',
            version: '1.0.0',
            description: 'API documentation for CareConnect Emergency Response Platform',
            contact: {
                name: 'CareConnect Support',
            },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/server.js', './src/modules/**/*.js'], // Files to scan for annotations
};

const specs = swaggerJsdoc(options);
module.exports = specs;
