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

		hello: {
			async handler(ctx) {
				const {text} = ctx.params
				const tmp = this.testmethod()
				return 'hello ' + tmp
			}
		},
		/**
		 * GET survej json from db by _id
		 *
		 * @returns 
		 */
		getById: {
      async handler(ctx) {
        const survey = await this.getById(ctx.params.survey_id)
        return survey
      }
		},
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
		testmethod() {
			return 'testmethod'
		}
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