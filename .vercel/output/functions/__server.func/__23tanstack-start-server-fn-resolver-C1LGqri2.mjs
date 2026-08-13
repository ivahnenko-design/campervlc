//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-C1LGqri2.js
var manifest = { "6ab6dbdfdd565ffbf591a5a523c49839d1a61b401eaacbb7ede0ec6d3779943d": {
	functionName: "fetchYescapaBookedDates_createServerFn_handler",
	importer: () => import("./_ssr/ical.functions-BNKac_-l.mjs")
} };
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
