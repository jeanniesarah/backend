"use strict";

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");

module.exports = {
    name: "completedSurvey",
    mixins: [DbService],
    adapter: new MongoDBAdapter(process.env.MONGO_URI),
    collection: "completedSurvey",

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

        create: {
            async handler(ctx) {
                const {survey_id, answers, comment, respondentClientId} = ctx.params
                const new_completedSurvey = await this.adapter.insert({
                    survey_id,
                    respondentClientId,
                    comment
                })
                ctx.call('answers.saveAnswers', {
                    completedSurvey_id: new_completedSurvey._id,
                    survey_id,
                    answers
                });
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