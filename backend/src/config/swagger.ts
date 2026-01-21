import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
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
    apis: ['./src/server.ts', './src/modules/**/*.ts'], // Files to scan for annotations
};

const specs = swaggerJsdoc(options);

export default specs;
