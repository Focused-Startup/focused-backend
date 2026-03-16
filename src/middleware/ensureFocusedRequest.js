const ensureFocusedRequest = (options = {}) => {
	const {
		appIdHeader = 'x-focused-app-id',
		appSecretHeader = 'x-focused-app-secret',
		expectedAppId = process.env.FOCUSED_APP_ID || 'focused',
		expectedAppSecret = process.env.FOCUSED_APP_SECRET,
	} = options;

	return function focusedRequestMiddleware(req, res, next) {
		const incomingAppId = req.get(appIdHeader);
		const incomingAppSecret = req.get(appSecretHeader);

		if (!expectedAppSecret) {
			return res.status(500).json({
				error: 'FOCUSED_APP_SECRET is not configured.',
			});
		}

		if (incomingAppId !== expectedAppId || incomingAppSecret !== expectedAppSecret) {
			return res.status(403).json({
				error: 'Forbidden: invalid Focused app credentials.',
			});
		}

		next();
	};
}

module.exports = {
	ensureFocusedRequest
};
