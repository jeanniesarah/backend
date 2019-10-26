"use strict";

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");

module.exports = {
  name: "answers",
  mixins: [DbService],
  adapter: new MongoDBAdapter(process.env.MONGO_URI),
  collection: "answers",

	/**
	 * Service settings
	 */
	settings: {

	},

	/**
	 * Service dependencies
	 */
	dependencies: [],	

	/**
	 * Actions
	 */
	actions: {

    saveAnswers: {
      /* params: {
        answers: {
          type: "array",
          items: {
            type: "object", props: {
                id: { type: "number", positive: true },
                name: { type: "string", empty: false },
                status: "boolean"
            }
        }
      }
    } */
      async handler(ctx) {
        const {survey_id, answers} = ctx.params
        await this.adapter.insert({survey_id, answers})
      }
    }
	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {

	},

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