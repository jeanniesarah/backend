"use strict";

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");

module.exports = {
    name: "survey",
    mixins: [DbService],
    adapter: new MongoDBAdapter(process.env.MONGO_URI),
    collection: "surveys",

    /**
     * Service settings
     */
    settings: {},

    /**
     * Service dependencies
     */
    dependencies: [],

    /**
     * Actions
     */
    actions: {
        /**
         * GET survej json from db by _id
         *
         * @returns
         */
        getById: {
            async handler(ctx) {
                const survey = await this.getById(ctx.params.survey_id);
                return survey;
            }
        },
        createSurvey: {
            params: {
                name: "string",
                title: "string"
            },
            async handler(ctx) {
                this.logger.info({userId: ctx.meta.user.userId});
                const {name, title} = ctx.params;
                const new_survey = await this.adapter.insert({
                    name,
                    title,
                    userId: ctx.meta.user.userId
                });
                return new_survey;
            }
        },
        getList: {
            async handler(ctx) {
                const new_survey_list = await this.adapter.find({
					query: {userId: ctx.meta.user.userId}
					// fields: ["_id", "name", "userID"]
                });
                return new_survey_list;
            }
        }
    },

    /**
     * Events
     */
    events: {},

    /**
     * Methods
     */
    methods: {},

    /**
     * Service created lifecycle event handler
     */
    created() {

    },

    /**
     * Service started lifecycle event handler
     */
    started() {

    },

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {

    }
};