'use strict';

var privacy_test = new TestSet()
    .require("[Method Exists] privacy", methodExists(chrome, 'privacy'), { hideOnSuccess: true })

    .require("[Property Exists] network", methodExists(chrome.privacy, 'network'))

    .require("[Property Exists] network.networkPredictionEnabled",
        methodExists(chrome.privacy.network, 'networkPredictionEnabled'), { hideOnSuccess: true })
    .require("[Property Get] network.networkPredictionEnabled", () => new Promise((resolve, reject) => {
        chrome.privacy.network.networkPredictionEnabled.get({}, () => resolve(''));
    }), { async: true })

    .skip('[Legacy] network.webRTCMultipleRoutesEnabled and webRTCNonProxiedUdpEnabled',
        'Use network.webRTCIPHandlingPolicy in the current API.')

    .require("[Property Exists] network.webRTCIPHandlingPolicy",
        methodExists(chrome.privacy.network, 'webRTCIPHandlingPolicy'), { hideOnSuccess: true })
    .require("[Property Get] network.webRTCIPHandlingPolicy", () => new Promise((resolve, reject) => {
        chrome.privacy.network.webRTCIPHandlingPolicy.get({}, () => resolve(''))
    }), { async: true })

    .require("[Property Exists] services", methodExists(chrome.privacy, 'services'))

    .require("[Property Exists] services.alternateErrorPagesEnabled",
        methodExists(chrome.privacy.services, 'alternateErrorPagesEnabled'), { hideOnSuccess: true })
    .require("[Property Get] services.alternateErrorPagesEnabled", () => new Promise((resolve, reject) => {
        chrome.privacy.services.alternateErrorPagesEnabled.get({}, () => resolve(''));
    }), { async: true })

    .require("[Property Exists] services.autofillEnabled",
        methodExists(chrome.privacy.services, 'autofillEnabled'), { hideOnSuccess: true })
    .require("[Property Get] services.autofillEnabled", () => new Promise((resolve, reject) => {
        chrome.privacy.services.autofillEnabled.get({}, () => resolve(''));
    }), { async: true })

    .skip('[Legacy] services.hotwordSearchEnabled', 'Removed from the current Chrome privacy API.')

    .require("[Property Exists] services.passwordSavingEnabled",
        methodExists(chrome.privacy.services, 'passwordSavingEnabled'), { hideOnSuccess: true })
    .require("[Property Get] services.passwordSavingEnabled", () => new Promise((resolve, reject) => {
        chrome.privacy.services.passwordSavingEnabled.get({}, () => resolve(''));
    }), { async: true })

    .require("[Property Exists] services.safeBrowsingEnabled",
        methodExists(chrome.privacy.services, 'safeBrowsingEnabled'), { hideOnSuccess: true })
    .require("[Property Get] services.safeBrowsingEnabled", () => new Promise((resolve, reject) => {
        chrome.privacy.services.safeBrowsingEnabled.get({}, () => resolve(''));
    }), { async: true })

    .require("[Property Exists] services.safeBrowsingExtendedReportingEnabled",
        methodExists(chrome.privacy.services, 'safeBrowsingExtendedReportingEnabled'), { hideOnSuccess: true })
    .require("[Property Get] services.safeBrowsingExtendedReportingEnabled", () => new Promise((resolve, reject) => {
        chrome.privacy.services.safeBrowsingExtendedReportingEnabled.get({}, () => resolve(''));
    }), { async: true })

    .require("[Property Exists] services.searchSuggestEnabled",
        methodExists(chrome.privacy.services, 'searchSuggestEnabled'), { hideOnSuccess: true })
    .require("[Property Get] services.searchSuggestEnabled", () => new Promise((resolve, reject) => {
        chrome.privacy.services.searchSuggestEnabled.get({}, () => resolve(''));
    }), { async: true })

    .suggest("[Property Exists] services.spellingServiceEnabled",
        methodExists(chrome.privacy.services, 'spellingServiceEnabled'), { hideOnSuccess: true })
    .suggest("[Property Get] services.spellingServiceEnabled {Unsupported on Android}", () => "Test disabled")

    .require("[Property Exists] services.translationServiceEnabled",
        skipOnAndroid(methodExists(chrome.privacy.services, 'translationServiceEnabled')), { hideOnSuccess: true })
    .require("[Property Get] services.translationServiceEnabled", skipOnAndroid(() => new Promise((resolve, reject) => {
        chrome.privacy.services.translationServiceEnabled.get({}, () => resolve(''));
    })), { async: true })

    .require("[Property Exists] websites", methodExists(chrome.privacy, 'websites'))

    .require("[Property Exists] websites.thirdPartyCookiesAllowed",
        methodExists(chrome.privacy.websites, 'thirdPartyCookiesAllowed'), { hideOnSuccess: true })
    .require("[Property Get] websites.thirdPartyCookiesAllowed", () => new Promise((resolve, reject) => {
        chrome.privacy.websites.thirdPartyCookiesAllowed.get({}, () => resolve(''));
    }), { async: true })

    .require("[Property Exists] websites.hyperlinkAuditingEnabled",
        methodExists(chrome.privacy.websites, 'hyperlinkAuditingEnabled'), { hideOnSuccess: true })
    .require("[Property Get] websites.hyperlinkAuditingEnabled", () => new Promise((resolve, reject) => {
        chrome.privacy.websites.hyperlinkAuditingEnabled.get({}, () => resolve(''));
    }), { async: true })

    .require("[Property Exists] websites.referrersEnabled",
        methodExists(chrome.privacy.websites, 'referrersEnabled'), { hideOnSuccess: true })
    .require("[Property Get] websites.referrersEnabled", () => new Promise((resolve, reject) => {
        chrome.privacy.websites.referrersEnabled.get({}, () => resolve(''));
    }), { async: true })

    .suggest("[Property Exists] {Windows and ChromeOS} websites.protectedContentEnabled",
        methodExists(chrome.privacy.websites, 'protectedContentEnabled'), { hideOnSuccess: true })
    .suggest("[Property Get] {Windows and ChromeOS} websites.protectedContentEnabled", () => new Promise((resolve, reject) => {
        chrome.privacy.websites.protectedContentEnabled.get({}, () => resolve(''));
    }), { async: true });
