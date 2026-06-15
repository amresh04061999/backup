var Opportunity = (function () {
    var formContext = null;
    var AccountResult = null;
    var CountryUSGuid = "538ac8ba-5e3b-e911-a829-000d3a365e48";
    //var StageName = { "Discovery": "dubois_winprobability", "Presentation & Proposal": "dubois_proposalwinprobability", "Trial": "dubois_trialwinprobability", "Closing": "dubois_closingwinprobability" }
    //var StageOrder = { "Discovery": 1, "Presentation & Proposal": 2, "Trial": 3, "Closing": 4 }
    //var StageOrderWiseName = { 1: "dubois_winprobability", 2: "dubois_proposalwinprobability", 3: "dubois_trialwinprobability", 4: "dubois_closingwinprobability" }
    var StageName = { "Discovery": "dubois_winprobability", "Technical Evaluation": "dubois_proposalwinprobability", "Negotiation": "dubois_proposalwinprobability", "Trial": "dubois_trialwinprobability", "Closing": "dubois_closingwinprobability" }
    var StageOrder = { "Discovery": 1, "Technical Evaluation": 2, "Negotiation": 3, "Trial": 4, "Closing": 5 }
    var StageOrderWiseName = { 1: "dubois_winprobability", 2: "dubois_proposalwinprobability", 3: "dubois_proposalwinprobability", 4: "dubois_trialwinprobability", 5: "dubois_closingwinprobability" }
    var StageProbability = { "Discovery": 25, "Technical Evaluation": 50, "Negotiation": 75 }
    var EquepmentBPF = "Equipment Price Exception Process";
    var EquepmentStageName = "Sales Person";
    var ChemicalBPF = "Chemical Price Exception Process";
    var ChemicalStageName = "Sales Person";
    var CurrentStageNo = 0;
    var accountName = "parentaccountid";
    var parentOpportunity = "dubois_parentopportunity";
    var approvalDemoAdvanceInProgress = false;
    var ApprovalDemoStatus = { Pending: 0, Approved: 1, Rejected: 2 };
    var ApprovalDemoQuoteStatus = { WaitingManager: 5, WaitingProduct: 7, WaitingCommercial: 8, WaitingEnterprise: 9, Approved: 3, Rejected: 4 };
    var ApprovalDemoStageIds = {
        Discovery: "71974a9b-968f-49fc-a25f-6d98c10397c3",
        Evaluation: "4ac38bb9-fc67-4a10-9625-bc8bde5caecb",
        Negotiation: "3bcebe94-686d-49cd-a658-20ad4da2db83",
        Manager: "0f9e66c0-5a53-429d-b91c-092dcfd00847",
        Product: "eb6e7ae2-4127-4a42-a8f2-d69cb4c8b96b",
        Commercial: "a45c13cb-f5ee-4b90-82eb-c9735800d269",
        Enterprise: "91c0fc9a-4555-4a13-b0a7-965b64634d46",
        Closing: "e2b06abd-34d5-4062-9303-d4c75b54837b"
    };
    var ApprovalDemoStagePath = {
        Negotiation: [ApprovalDemoStageIds.Discovery, ApprovalDemoStageIds.Evaluation, ApprovalDemoStageIds.Negotiation].join(","),
        Manager: [ApprovalDemoStageIds.Discovery, ApprovalDemoStageIds.Evaluation, ApprovalDemoStageIds.Negotiation, ApprovalDemoStageIds.Manager].join(","),
        Product: [ApprovalDemoStageIds.Discovery, ApprovalDemoStageIds.Evaluation, ApprovalDemoStageIds.Negotiation, ApprovalDemoStageIds.Manager, ApprovalDemoStageIds.Product].join(","),
        Commercial: [ApprovalDemoStageIds.Discovery, ApprovalDemoStageIds.Evaluation, ApprovalDemoStageIds.Negotiation, ApprovalDemoStageIds.Manager, ApprovalDemoStageIds.Product, ApprovalDemoStageIds.Commercial].join(","),
        Enterprise: [ApprovalDemoStageIds.Discovery, ApprovalDemoStageIds.Evaluation, ApprovalDemoStageIds.Negotiation, ApprovalDemoStageIds.Manager, ApprovalDemoStageIds.Product, ApprovalDemoStageIds.Commercial, ApprovalDemoStageIds.Enterprise].join(","),
        Closing: [ApprovalDemoStageIds.Discovery, ApprovalDemoStageIds.Evaluation, ApprovalDemoStageIds.Negotiation, ApprovalDemoStageIds.Manager, ApprovalDemoStageIds.Product, ApprovalDemoStageIds.Commercial, ApprovalDemoStageIds.Enterprise, ApprovalDemoStageIds.Closing].join(",")
    };

    function setControlVisible(controlName, isVisible) {
        if (!controlName)
            return;

        var control = formContext.getControl(controlName);
        if (control && typeof control.setVisible === "function")
            control.setVisible(isVisible);
    }

    function setFieldDisabled(fieldName, isDisabled) {
        if (!fieldName || !formContext || !formContext.ui || !formContext.ui.controls)
            return;

        formContext.ui.controls.get().forEach(function (control) {
            var controlName = control && typeof control.getName === "function" ? control.getName() : "";
            var attribute = control && typeof control.getAttribute === "function" ? control.getAttribute() : null;
            var attributeName = attribute && typeof attribute.getName === "function" ? attribute.getName() : "";

            if (attributeName == fieldName || controlName == fieldName || controlName.indexOf("header_process_" + fieldName) == 0 || controlName.indexOf(fieldName) >= 0) {
                if (typeof control.setDisabled === "function")
                    control.setDisabled(isDisabled);
            }
        });
    }

    function setFieldVisible(fieldName, isVisible) {
        if (!fieldName || !formContext || !formContext.ui || !formContext.ui.controls)
            return;

        formContext.ui.controls.get().forEach(function (control) {
            var controlName = control && typeof control.getName === "function" ? control.getName() : "";
            var attribute = control && typeof control.getAttribute === "function" ? control.getAttribute() : null;
            var attributeName = attribute && typeof attribute.getName === "function" ? attribute.getName() : "";

            if (attributeName == fieldName || controlName == fieldName || controlName.indexOf("header_process_" + fieldName) == 0 || controlName.indexOf(fieldName) >= 0) {
                if (typeof control.setVisible === "function")
                    control.setVisible(isVisible);
            }
        });
    }

    function lockClosingStatusField() {
        setFieldDisabled("statecode", true);
        setFieldVisible("statecode", false);
    }

    function disableLegacyProductLineGate() {
        var attribute = formContext && formContext.getAttribute("dubois_productlinesselected");
        if (!attribute)
            return;

        if (typeof attribute.setRequiredLevel === "function")
            attribute.setRequiredLevel("none");
        if (attribute.getValue() == null)
            attribute.setValue(true);
        setFieldDisabled("dubois_productlinesselected", true);
    }

    function lockApprovalStageFields() {
        var activeStageName = "";
        if (formContext && formContext.data && formContext.data.process && formContext.data.process.getActiveStage()) {
            activeStageName = formContext.data.process.getActiveStage().getName();
        }

        var stageFields = {
            "Manager Approval": ["cr14d_dubois_salesmanagerapprovalstatus", "cr14d_dubois_salesmanagernotes"],
            "Product Approval": ["cr14d_dubois_productapprovalstatus", "cr14d_dubois_productnotes"],
            "Commercial Approval": ["cr14d_dubois_vpapprovalstatus", "cr14d_dubois_vpnotes"],
            "VP Approval": ["cr14d_dubois_vpapprovalstatus", "cr14d_dubois_vpnotes"],
            "Enterprise Approval": ["cr14d_dubois_enterpriseapprovalstatus", "cr14d_dubois_enterprisenotes"]
        };
        var allFields = [
            "cr14d_dubois_salesmanagerapprovalstatus",
            "cr14d_dubois_salesmanagernotes",
            "cr14d_dubois_productapprovalstatus",
            "cr14d_dubois_productnotes",
            "cr14d_dubois_vpapprovalstatus",
            "cr14d_dubois_vpnotes",
            "cr14d_dubois_enterpriseapprovalstatus",
            "cr14d_dubois_enterprisenotes",
            "cr14d_dubois_approvallevelrequired"
        ];

        allFields.forEach(function (fieldName) {
            setFieldDisabled(fieldName, true);
        });

        // Approval decisions are made on the CRM Quote. The Opportunity BPF is a read-only progress display.
        setFieldDisabled("cr14d_dubois_approvallevelrequired", true);
        lockClosingStatusField();
        disableLegacyProductLineGate();
    }

    function applyApprovalStageLocks() {
        lockApprovalStageFields();
        setTimeout(lockApprovalStageFields, 250);
        setTimeout(lockApprovalStageFields, 1000);
    }

    function getActiveStageName() {
        if (formContext && formContext.data && formContext.data.process && formContext.data.process.getActiveStage()) {
            return formContext.data.process.getActiveStage().getName();
        }

        return "";
    }

    function normalizeGuid(id) {
        return id ? id.replace(/[{}]/g, "").toLowerCase() : "";
    }

    function notifyApprovalDemo(message, level) {
        if (!formContext || !formContext.ui || typeof formContext.ui.setFormNotification !== "function")
            return;

        formContext.ui.setFormNotification(message, level || "INFO", "dubois_opportunity_screen_approval");
        setTimeout(function () {
            if (formContext && formContext.ui && typeof formContext.ui.clearFormNotification === "function")
                formContext.ui.clearFormNotification("dubois_opportunity_screen_approval");
        }, 9000);
    }

    function focusPriceAdvisorTab() {
        if (!formContext || !formContext.ui || !formContext.ui.tabs)
            return;

        var priceAdvisorTab = formContext.ui.tabs.get("tab_14");
        if (priceAdvisorTab && typeof priceAdvisorTab.setFocus === "function")
            priceAdvisorTab.setFocus();
    }

    function getCurrentOpportunityId() {
        return normalizeGuid(formContext && formContext.data && formContext.data.entity ? formContext.data.entity.getId() : "");
    }

    function getRelatedApprovalQuote() {
        var opportunityId = getCurrentOpportunityId();
        if (!opportunityId)
            return Promise.reject(new Error("Opportunity id was not available."));

        var approvalStatusFilter = "(dubois_approvalstatus eq 2 or dubois_approvalstatus eq 3 or dubois_approvalstatus eq 5 or dubois_approvalstatus eq 7 or dubois_approvalstatus eq 8 or dubois_approvalstatus eq 9)";
        var query = "?$select=quoteid,quotenumber,statecode,statuscode,totalamount,dubois_totalquoterevenue,dubois_approvalstatus,dubois_approval_level_required,_transactioncurrencyid_value&$filter=_opportunityid_value eq " + opportunityId + " and " + approvalStatusFilter + "&$orderby=modifiedon desc&$top=1";
        return Xrm.WebApi.retrieveMultipleRecords("quote", query).then(function (result) {
            if (!result.entities || !result.entities.length)
                throw new Error("No related quote was found for this opportunity.");

            return result.entities[0];
        });
    }

    function getOpportunityProcessInstance() {
        var opportunityId = getCurrentOpportunityId();
        if (!opportunityId)
            return Promise.reject(new Error("Opportunity id was not available."));

        var query = "?$select=businessprocessflowinstanceid,traversedpath,_activestageid_value&$filter=_bpf_opportunityid_value eq " + opportunityId + "&$top=1";
        return Xrm.WebApi.retrieveMultipleRecords("dubois_opportunityprocess", query).then(function (result) {
            if (!result.entities || !result.entities.length)
                throw new Error("No Opportunity Process BPF instance was found.");

            return result.entities[0];
        });
    }

    function updateOpportunityProcessStage(stageKey) {
        var stageId = ApprovalDemoStageIds[stageKey];
        var traversedPath = ApprovalDemoStagePath[stageKey];
        if (!stageId || !traversedPath)
            return Promise.reject(new Error("Unknown approval stage route: " + stageKey));

        return getOpportunityProcessInstance().then(function (processInstance) {
            return Xrm.WebApi.updateRecord("dubois_opportunityprocess", processInstance.businessprocessflowinstanceid, {
                "activestageid@odata.bind": "/processstages(" + stageId + ")",
                "traversedpath": traversedPath
            });
        });
    }

    function updateRelatedApprovalQuote(quoteStatus) {
        return getRelatedApprovalQuote().then(function (quote) {
            return Xrm.WebApi.updateRecord("quote", quote.quoteid, {
                "dubois_approvalstatus": quoteStatus
            });
        });
    }

    function updateRelatedApprovalQuoteWithoutBlockingStage(quoteStatus) {
        return updateRelatedApprovalQuote(quoteStatus).catch(function (error) {
            notifyApprovalDemo("The Opportunity Process will advance, but the related quote status could not be updated: " + (error && error.message ? error.message : error), "WARNING");
            return Promise.resolve();
        });
    }

    function updateOpportunityApprovalStageField(statusField, notesField, statusValue) {
        var opportunityId = getCurrentOpportunityId();
        if (!opportunityId)
            return Promise.reject(new Error("Opportunity id was not available."));

        var payload = {};
        payload[statusField] = statusValue;
        if (notesField && formContext.getAttribute(notesField))
            payload[notesField] = formContext.getAttribute(notesField).getValue();

        return Xrm.WebApi.updateRecord("opportunity", opportunityId, payload);
    }

    function approvalLevelRequiredValue() {
        return formContext.getAttribute("cr14d_dubois_approvallevelrequired") ? formContext.getAttribute("cr14d_dubois_approvallevelrequired").getValue() : null;
    }

    function approvalStageConfig(stageName) {
        var configs = {
            "Manager Approval": { statusField: "cr14d_dubois_salesmanagerapprovalstatus", notesField: "cr14d_dubois_salesmanagernotes" },
            "Product Approval": { statusField: "cr14d_dubois_productapprovalstatus", notesField: "cr14d_dubois_productnotes" },
            "Commercial Approval": { statusField: "cr14d_dubois_vpapprovalstatus", notesField: "cr14d_dubois_vpnotes" },
            "VP Approval": { statusField: "cr14d_dubois_vpapprovalstatus", notesField: "cr14d_dubois_vpnotes" },
            "Enterprise Approval": { statusField: "cr14d_dubois_enterpriseapprovalstatus", notesField: "cr14d_dubois_enterprisenotes" }
        };

        return configs[stageName] || null;
    }

    function routeApprovedOpportunityStage(stageName) {
        var level = approvalLevelRequiredValue();

        if (stageName == "Manager Approval") {
            if (level >= 2)
                return updateRelatedApprovalQuoteWithoutBlockingStage(ApprovalDemoQuoteStatus.WaitingProduct).then(function () { return updateOpportunityProcessStage("Product"); });

            return updateRelatedApprovalQuoteWithoutBlockingStage(ApprovalDemoQuoteStatus.Approved).then(function () { return updateOpportunityProcessStage("Closing"); });
        }

        if (stageName == "Product Approval") {
            if (level >= 3)
                return updateRelatedApprovalQuoteWithoutBlockingStage(ApprovalDemoQuoteStatus.WaitingCommercial).then(function () { return updateOpportunityProcessStage("Commercial"); });

            return updateRelatedApprovalQuoteWithoutBlockingStage(ApprovalDemoQuoteStatus.Approved).then(function () { return updateOpportunityProcessStage("Closing"); });
        }

        if (stageName == "Commercial Approval" || stageName == "VP Approval") {
            if (level >= 4)
                return updateRelatedApprovalQuoteWithoutBlockingStage(ApprovalDemoQuoteStatus.WaitingEnterprise).then(function () { return updateOpportunityProcessStage("Enterprise"); });

            return updateRelatedApprovalQuoteWithoutBlockingStage(ApprovalDemoQuoteStatus.Approved).then(function () { return updateOpportunityProcessStage("Closing"); });
        }

        if (stageName == "Enterprise Approval")
            return updateRelatedApprovalQuoteWithoutBlockingStage(ApprovalDemoQuoteStatus.Approved).then(function () { return updateOpportunityProcessStage("Closing"); });

        return Promise.resolve();
    }

    function rejectOpportunityStage(stageName, config) {
        return updateOpportunityApprovalStageField(config.statusField, config.notesField, ApprovalDemoStatus.Rejected)
            .then(function () {
                return updateRelatedApprovalQuoteWithoutBlockingStage(ApprovalDemoQuoteStatus.Rejected);
            })
            .then(function () {
                return updateOpportunityProcessStage("Negotiation");
            });
    }

    function executeDataverseRequest(request) {
        if (Xrm.WebApi.online && typeof Xrm.WebApi.online.execute === "function")
            return Xrm.WebApi.online.execute(request);

        return Xrm.WebApi.execute(request);
    }

    function quoteRevenueForClose(quote) {
        var value = quote ? quote.dubois_totalquoterevenue || quote.totalamount : null;
        if (!value && formContext && formContext.getAttribute("estimatedvalue"))
            value = formContext.getAttribute("estimatedvalue").getValue();

        return Number(value || 0) || 0;
    }

    function ensureOpportunityProductForPriceAdvisorQuote(opportunityId, quote) {
        var query = "?$select=opportunityproductid&$filter=_opportunityid_value eq " + opportunityId + "&$top=1";
        return Xrm.WebApi.retrieveMultipleRecords("opportunityproduct", query).then(function (result) {
            if (result.entities && result.entities.length)
                return Promise.resolve();

            var payload = {
                "opportunityid@odata.bind": "/opportunities(" + opportunityId + ")",
                isproductoverridden: true,
                productdescription: "Price Advisor approved quote " + (quote.quotenumber || ""),
                quantity: 1,
                priceperunit: quoteRevenueForClose(quote),
                ispriceoverridden: true
            };

            if (quote._transactioncurrencyid_value)
                payload["transactioncurrencyid@odata.bind"] = "/transactioncurrencies(" + quote._transactioncurrencyid_value + ")";

            return Xrm.WebApi.createRecord("opportunityproduct", payload);
        });
    }

    function activatePriceAdvisorQuoteIfNeeded(quote) {
        if (!quote || quote.statecode != 0)
            return Promise.resolve(quote);

        return Xrm.WebApi.updateRecord("quote", quote.quoteid, {
            statecode: 1,
            statuscode: 2
        }).then(function () {
            quote.statecode = 1;
            quote.statuscode = 2;
            return quote;
        });
    }

    function winPriceAdvisorQuoteIfNeeded(quote) {
        if (!quote || quote.statecode == 2)
            return Promise.resolve(quote);

        var request = {
            QuoteClose: {
                "quoteid@odata.bind": "/quotes(" + quote.quoteid + ")",
                subject: "Won after Price Advisor approval",
                actualend: new Date().toISOString()
            },
            Status: 4,
            getMetadata: function () {
                return {
                    boundParameter: null,
                    parameterTypes: {
                        QuoteClose: {
                            typeName: "mscrm.quoteclose",
                            structuralProperty: 5
                        },
                        Status: {
                            typeName: "Edm.Int32",
                            structuralProperty: 1
                        }
                    },
                    operationType: 0,
                    operationName: "WinQuote"
                };
            }
        };

        return executeDataverseRequest(request).then(function () {
            quote.statecode = 2;
            quote.statuscode = 4;
            return quote;
        });
    }

    function preparePriceAdvisorQuoteForOpportunityClose(opportunityId) {
        return getRelatedApprovalQuote()
            .then(function (quote) {
                return ensureOpportunityProductForPriceAdvisorQuote(opportunityId, quote)
                    .then(function () { return activatePriceAdvisorQuoteIfNeeded(quote); })
                    .then(winPriceAdvisorQuoteIfNeeded);
            });
    }

    function closeOpportunityAsWonFromClosingStage() {
        var opportunityId = getCurrentOpportunityId();
        if (!opportunityId)
            return Promise.reject(new Error("Opportunity id was not available."));

        var request = {
            OpportunityClose: {
                "opportunityid@odata.bind": "/opportunities(" + opportunityId + ")",
                subject: "Won after Price Advisor approval",
                actualend: new Date().toISOString()
            },
            Status: 3,
            getMetadata: function () {
                return {
                    boundParameter: null,
                    parameterTypes: {
                        OpportunityClose: {
                            typeName: "mscrm.opportunityclose",
                            structuralProperty: 5
                        },
                        Status: {
                            typeName: "Edm.Int32",
                            structuralProperty: 1
                        }
                    },
                    operationType: 0,
                    operationName: "WinOpportunity"
                };
            }
        };

        return preparePriceAdvisorQuoteForOpportunityClose(opportunityId).then(function () {
            return executeDataverseRequest(request);
        });
    }

    function handleOpportunityScreenApproval(stageName, statusField, notesField) {
        if (approvalDemoAdvanceInProgress || !formContext || !formContext.getAttribute(statusField))
            return;

        var statusValue = formContext.getAttribute(statusField).getValue();
        if (statusValue != ApprovalDemoStatus.Approved && statusValue != ApprovalDemoStatus.Rejected)
            return;

        if (stageName != getActiveStageName())
            return;

        approvalDemoAdvanceInProgress = true;
        notifyApprovalDemo("Processing approval from the Opportunity stage...", "INFO");

        updateOpportunityApprovalStageField(statusField, notesField, statusValue)
            .then(function () {
                if (statusValue == ApprovalDemoStatus.Rejected)
                    return updateRelatedApprovalQuoteWithoutBlockingStage(ApprovalDemoQuoteStatus.Rejected)
                        .then(function () { return updateOpportunityProcessStage("Negotiation"); });

                return routeApprovedOpportunityStage(stageName);
            })
            .then(function () {
                notifyApprovalDemo(statusValue == ApprovalDemoStatus.Rejected ? "Quote rejected. Revise it on the Price Advisor tab and request approval again." : "Approval captured. The Opportunity Process has advanced.", "INFO");
                return formContext.data.refresh(false);
            })
            .then(function () {
                if (statusValue == ApprovalDemoStatus.Rejected)
                    focusPriceAdvisorTab();
                applyApprovalStageLocks();
            })
            .catch(function (error) {
                notifyApprovalDemo("Could not process the Opportunity approval: " + (error && error.message ? error.message : error), "ERROR");
            })
            .then(function () {
                approvalDemoAdvanceInProgress = false;
            });
    }

    function registerOpportunityScreenApprovalHandlers() {
        var handlers = [
            { stageName: "Manager Approval", statusField: "cr14d_dubois_salesmanagerapprovalstatus", notesField: "cr14d_dubois_salesmanagernotes" },
            { stageName: "Product Approval", statusField: "cr14d_dubois_productapprovalstatus", notesField: "cr14d_dubois_productnotes" },
            { stageName: "Commercial Approval", statusField: "cr14d_dubois_vpapprovalstatus", notesField: "cr14d_dubois_vpnotes" },
            { stageName: "Enterprise Approval", statusField: "cr14d_dubois_enterpriseapprovalstatus", notesField: "cr14d_dubois_enterprisenotes" }
        ];

        handlers.forEach(function (handler) {
            var attribute = formContext.getAttribute(handler.statusField);
            if (attribute) {
                attribute.addOnChange(function () {
                    handleOpportunityScreenApproval(handler.stageName, handler.statusField, handler.notesField);
                });
            }
        });
    }

    function advanceApprovalStageFromNextButton(stageName) {
        var config = approvalStageConfig(stageName);
        if (!config || approvalDemoAdvanceInProgress)
            return;

        approvalDemoAdvanceInProgress = true;
        var requestedStatus = formContext.getAttribute(config.statusField) ? formContext.getAttribute(config.statusField).getValue() : null;
        var isRejected = requestedStatus == ApprovalDemoStatus.Rejected;
        notifyApprovalDemo((isRejected ? "Rejecting " : "Approving ") + stageName + "...", "INFO");

        (isRejected
            ? rejectOpportunityStage(stageName, config)
            : updateOpportunityApprovalStageField(config.statusField, config.notesField, ApprovalDemoStatus.Approved).then(function () { return routeApprovedOpportunityStage(stageName); }))
            .then(function () {
                notifyApprovalDemo(isRejected ? stageName + " rejected. Revise it on the Price Advisor tab and request approval again." : stageName + " approved. The Opportunity Process has advanced.", "INFO");
                return formContext.data.refresh(false);
            })
            .then(function () {
                if (isRejected)
                    focusPriceAdvisorTab();
                applyApprovalStageLocks();
            })
            .catch(function (error) {
                notifyApprovalDemo("Could not advance the Opportunity approval: " + (error && error.message ? error.message : error), "ERROR");
            })
            .then(function () {
                approvalDemoAdvanceInProgress = false;
            });
    }

    function handleApprovalStageNextButton(executionContext) {
        var eventArgs = executionContext && typeof executionContext.getEventArgs === "function" ? executionContext.getEventArgs() : null;
        if (!eventArgs || typeof eventArgs.getDirection !== "function" || typeof eventArgs.preventDefault !== "function")
            return;

        if (eventArgs.getDirection() !== "Next")
            return;

        var stageName = getActiveStageName();
        if (!approvalStageConfig(stageName))
            return;

        eventArgs.preventDefault();
        notifyApprovalDemo("Approval decisions are made on the related CRM Quote. Open the Quote from the Opportunity or approval queue to approve or reject.", "INFO");
    }

    function finishClosingStageFromNextButton(executionContext) {
        var eventArgs = executionContext && typeof executionContext.getEventArgs === "function" ? executionContext.getEventArgs() : null;
        if (!eventArgs || typeof eventArgs.getDirection !== "function" || typeof eventArgs.preventDefault !== "function")
            return;

        if (eventArgs.getDirection() !== "Next" || getActiveStageName() != "Closing")
            return;

        eventArgs.preventDefault();
        if (approvalDemoAdvanceInProgress)
            return;

        approvalDemoAdvanceInProgress = true;
        lockClosingStatusField();
        notifyApprovalDemo("Closing the Opportunity as won...", "INFO");

        closeOpportunityAsWonFromClosingStage()
            .then(function () {
                notifyApprovalDemo("Opportunity closed as won.", "INFO");
                return formContext.data.refresh(false);
            })
            .catch(function (error) {
                notifyApprovalDemo("Could not close the Opportunity as won: " + (error && error.message ? error.message : error), "ERROR");
            })
            .then(function () {
                approvalDemoAdvanceInProgress = false;
            });
    }

    function CallOnLoad(executionContext) {
        if (formContext == null)
            formContext = executionContext.getFormContext(); // get formContext
        //getSpecialtyFromAccount();
        //Xrm.Page.getControl("dubois_closedate").setDisabled(true);

        formContext.getAttribute(parentOpportunity).addOnChange(Opportunity.preFilterLookupOpportunityBasedonAccount);
        preFilterLookupOpportunityBasedonAccount(executionContext);
        AddPreFilterOnAccountLookup();
        addPreFilterContactLookup(executionContext);
        ShowHideWinProbField();
        //Xrm.Page.getControl("Stakeholder").addOnLoad(ChangeBuyersRoleOnGridLoad);
        formContext.getAttribute("dubois_salesrep").addOnChange(Opportunity.OnChangeofSalesPerson);
        CallOnChangeofPERequired(executionContext);
        OnChangeOfOpportunityType(executionContext);
        CallOnChangeofStage(executionContext);
        formContext.data.process.addOnStageChange(Opportunity.CallOnChangeofStage);
        if (formContext.data.process && typeof formContext.data.process.addOnStageSelected === "function")
            formContext.data.process.addOnStageSelected(applyApprovalStageLocks);
        if (formContext.data.process && typeof formContext.data.process.addOnPreStageChange === "function") {
            formContext.data.process.addOnPreStageChange(handleApprovalStageNextButton);
            formContext.data.process.addOnPreStageChange(finishClosingStageFromNextButton);
        }
        // Approval decisions are processed from the related CRM Quote. The Opportunity BPF mirrors quote progress.
        if (formContext.getAttribute("dubois_perequired"))
            formContext.getAttribute("dubois_perequired").addOnChange(Opportunity.CallOnChangeofPERequired);
        formContext.getControl("dubois_chemicalpricelist").addPreSearch(FilteredChemicalPriceList);
        formContext.getControl("dubois_equipmentpricelist").addPreSearch(FilteredEquipmentPriceList);
        if (formContext.getControl("header_process_parentcontactid"))
            formContext.getControl("header_process_parentcontactid").addPreSearch(addLookupFilterForMainAcc);
        if (formContext.ui.getFormType() == 1) {
            formContext.getControl("dubois_valuetype").removeOption(1);
            formContext.getAttribute("closeprobability").setValue(25);
            SetAssignmentSectionfieldsfromAccount(executionContext);
        }
        if (formContext.getAttribute("dubois_chemicalpricelist") != null && formContext.getAttribute("dubois_chemicalpricelist").getValue() != null)
            formContext.getControl("dubois_chemicalpricelist").setDisabled(true);
        if (formContext.getAttribute("dubois_equipmentpricelist") != null && formContext.getAttribute("dubois_equipmentpricelist").getValue() != null)
            formContext.getControl("dubois_equipmentpricelist").setDisabled(true);

        formContext.getAttribute("parentaccountid").addOnChange(GetParentAccountData);
        GetUSData();
        checkBPF();
        formContext.getAttribute("parentcontactid").setRequiredLevel("required");
        formContext.getAttribute("estimatedclosedate").setRequiredLevel("required");
        formContext.getAttribute("dubois_repestrevenue").setRequiredLevel("required");

        const oppType = formContext.getAttribute("dubois_opportunitytype").getValue();
        const oppControl = formContext.getControl("dubois_opportunitytype");
        if (oppType !== 1) {
            oppControl.removeOption(1);
        }

        if (oppType !== 2) {
            oppControl.removeOption(2);
        }

        if (formContext.getControl("SubgridProductLines"))
            formContext.getControl("SubgridProductLines").addOnLoad(checkProductLinesCount);

        formContext.getControl("header_process_dubois_valuetype").setVisible(false);
        formContext.getControl("header_process_dubois_opportunitysourcenew").setVisible(false);
        formContext.getControl("header_process_dubois_sectorpotential").setVisible(false);

        //formContext.getControl("dubois_requiredtrial").setVisible(false);
        formContext.getControl("header_process_dubois_autocalculaterevenue").setVisible(false);
        formContext.getControl("header_process_dubois_proposalwinprobability").setVisible(false);
        formContext.getControl("header_process_dubois_perequired").setVisible(false);
        formContext.getControl("header_process_dubois_sharedtestimonial").setVisible(false);
        //Closing
        formContext.getControl("header_process_dubois_closingwinprobability").setVisible(false);
        disableLegacyProductLineGate();
        applyApprovalStageLocks();

    }

    function CallonSave(executionContext) {
        if (formContext == null)
            formContext = executionContext.getFormContext(); // get formContext
        if (formContext.ui.getFormType() == 1) {
            //if (Xrm.Page.getAttribute("traversedpath") != null)
            //    Xrm.Page.getAttribute("traversedpath").setValue("");
            //if (Xrm.Page.getAttribute("stageid") != null)
            //    Xrm.Page.getAttribute("stageid").setValue("");
            //if (Xrm.Page.getAttribute("processid") != null)
            //    Xrm.Page.getAttribute("processid").setValue("");
            //if (Xrm.Page.getAttribute("businessprocessflowinstanceid") != null)
            //    Xrm.Page.getAttribute("businessprocessflowinstanceid").setValue("");
        }
        else {
            //if (Xrm.Page.getAttribute("traversedpath") != null)
            //    Xrm.Page.getAttribute("traversedpath").setValue("");
            //if (Xrm.Page.getAttribute("stageid") != null)
            //    Xrm.Page.getAttribute("stageid").setValue("");
            ////if (Xrm.Page.getAttribute("processid") != null)
            ////    Xrm.Page.getAttribute("processid").setValue("");
            //if (Xrm.Page.getAttribute("businessprocessflowinstanceid") != null)
            //    Xrm.Page.getAttribute("businessprocessflowinstanceid").setValue("");
        }

        formContext.getControl("dubois_comments").setVisible(false);
        formContext.getAttribute("dubois_comments").setRequiredLevel("none");
    }
    function GetUSData() {
        Xrm.WebApi.online.retrieveMultipleRecords("dubois_country", "?$select=dubois_countryid,dubois_name&$filter=dubois_name eq 'US'").then(
            function success(results) {
                if (results.entities.length > 0) {
                    CountryUSGuid = results.entities[0]["dubois_countryid"];
                }
            },
            function (e) {
                Xrm.Navigation.openAlertDialog({ text: e.message }, { height: 120, width: 260 }).then(function () { });
            }
        );
    }
    function checkBPF() {
        let stagename = "";
        if (formContext.data.process != null && formContext.data.process.getActiveStage() != null) {
            stagename = formContext.data.process.getActiveStage().getName();
        }
        if (stagename == "") {
            formContext.ui.setFormNotification("The BPF is missing!!", 'ERROR', 'dubois_bpf_key');
            formContext.ui.controls.get().forEach(function (control, index) {
                var controlType = control.getControlType();
                if (controlType != "iframe" && controlType != "webresource" && controlType != "subgrid") {
                    control.setDisabled(true);
                }
            });
        }
    }
    function GetParentAccountData(executionContext) {
        formContext = executionContext.getFormContext(); // get formContext
        let account = formContext.getAttribute("parentaccountid") != null ? formContext.getAttribute("parentaccountid").getValue() : null;
        if (account != null) {
            let FetchXml = "";
            FetchXml += "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>";
            FetchXml += "<entity name='account'>";
            FetchXml += "<attribute name='dubois_deliveryterm' />";
            FetchXml += "<attribute name='dubois_relationshiptype' />";
            FetchXml += "<attribute name='dubois_axcustomerid' />";
            FetchXml += "<attribute name='dubois_pricelisttype' />";
            FetchXml += "<filter type='and'>";
            FetchXml += "<condition attribute='accountid' operator='eq' value='" + account[0].id + "' />";
            FetchXml += "</filter>";
            FetchXml += "<link-entity name='dubois_address' from='dubois_addressid' to='dubois_newaddresslookup' link-type='outer' alias='Address' >";
            FetchXml += "<attribute name='dubois_country' />";
            FetchXml += "</link-entity>";
            FetchXml += "</entity>";
            FetchXml += "</fetch>";

            FetchXml = "?fetchXml=" + encodeURIComponent(FetchXml);
            Xrm.WebApi.retrieveMultipleRecords("account", FetchXml).then(
                function success(result) {
                    AccountResult = result;
                    SetPriceListfromAccount(account[0].id);
                },
                function (error) {
                    Xrm.Navigation.openAlertDialog({ text: error.message }, { height: 120, width: 260 }).then(function () { });
                }
            );
        } else {
            AccountResult = null;
            SetPriceListfromAccount(null);
        }
    }
    function FilteredChemicalPriceList() {
        let filtered = "";
        let IsDistributor = false;
        let IsCA = false;
        filtered += "<filter type='and'>";
        let account = formContext.getAttribute("parentaccountid") != null ? formContext.getAttribute("parentaccountid").getValue() : null;
        let deliveryTerm = null, country = null;
        if (account != null) {
            if (AccountResult != null && AccountResult.entities.length > 0) {
                let accountData = AccountResult.entities[0];
                if (accountData["dubois_relationshiptype"] == 3) {      //3 = Distributor
                    IsDistributor = true;
                }

                //if (accountData[0].attributes["Address.dubois_country"] == null || (accountData[0].attributes["Address.dubois_country"] != null && accountData[0].attributes["Address.dubois_country"].name != "CA")) {     //Avoid PriceListType filter for Canada
                if (accountData["dubois_axcustomerid"] != null) {
                    if (accountData["dubois_deliveryterm"] != null && accountData["dubois_deliveryterm"] == "DEL") {
                        filtered += "<condition attribute='dubois_deliveryterm' operator='eq' value='" + accountData["dubois_deliveryterm"] + "' />";
                    }
                    else if (accountData["dubois_deliveryterm"] != null) {
                        filtered += "<condition attribute='dubois_deliveryterm' operator='ne' value='DEL' />";
                    }
                }
                else {
                    if (accountData["dubois_pricelisttype"] != null && accountData["dubois_pricelisttype"] == 2) {
                        filtered += "<condition attribute='dubois_deliveryterm' operator='eq' value='DEL' />";
                    }
                    else if (accountData["dubois_pricelisttype"] != null) {
                        filtered += "<condition attribute='dubois_deliveryterm' operator='ne' value='DEL' />";
                    }
                }
                //}

                if (accountData["Address.dubois_country"] != null) {
                    if (accountData["Address.dubois_country@OData.Community.Display.V1.FormattedValue"] == "US" || accountData["Address.dubois_country@OData.Community.Display.V1.FormattedValue"] == "CA") {
                        if (accountData["Address.dubois_country@OData.Community.Display.V1.FormattedValue"] == "CA") {
                            IsCA = true;
                        }
                        filtered += "<condition attribute='dubois_country' operator='eq' value='" + accountData["Address.dubois_country"] + "' />";
                    }
                    else {
                        if (CountryUSGuid != '') {
                            filtered += "<condition attribute='dubois_country' operator='eq' value='" + CountryUSGuid + "' />";
                        }
                    }
                }
            }
        }
        if (IsDistributor) {
            filtered = "<filter type='and'>";
            if (IsCA) {
                filtered += "<condition attribute='name' operator='eq' value='CA Delivered Price List' />";
            }
            else {
                filtered += "<condition attribute='dubois_pricelistproducttype' operator='eq' value='3' />";
            }
        }
        else {
            filtered += "<condition attribute='dubois_pricelistproducttype' operator='eq' value='1' />";
        }

        //filtered += "<condition attribute='dubois_pricelistproducttype' operator='eq' value='1' />";
        filtered += "<condition attribute='statecode' operator='eq' value='0' />";
        if (formContext.getAttribute("dubois_equipmentpricelist") != null && formContext.getAttribute("dubois_equipmentpricelist").getValue() != null) {
            if (formContext.getAttribute("transactioncurrencyid").getValue() != null) {
                filtered += "<condition attribute='transactioncurrencyid' operator='eq' value='" + formContext.getAttribute("transactioncurrencyid").getValue()[0].id + "' />";
            }
        }
        filtered += "</filter>";
        formContext.getControl("dubois_chemicalpricelist").addCustomFilter(filtered);
    }

    function OnChangeofChemicalPricelist() {
        if (formContext == null)
            formContext = executionContext.getFormContext(); // get formContext

        if (formContext.getAttribute("dubois_chemicalpricelist") != null && formContext.getAttribute("dubois_chemicalpricelist").getValue() != null) {
            formContext.getAttribute("pricelevelid").setValue(formContext.getAttribute("dubois_chemicalpricelist").getValue());
            //let Column = ["transactioncurrencyid"];
            //let retrievedResult = XrmServiceToolkit.Soap.Retrieve("pricelevel", formContext.getAttribute("dubois_chemicalpricelist").getValue()[0].id, Column);
            //if (retrievedResult.attributes["transactioncurrencyid"] != null) {
            //    formContext.getAttribute("transactioncurrencyid").setValue([{ id: retrievedResult.attributes["transactioncurrencyid"].id, name: retrievedResult.attributes["transactioncurrencyid"].name, entityType: "transactioncurrency" }]);
            //}
            Xrm.WebApi.retrieveRecord("pricelevel", formContext.getAttribute("dubois_chemicalpricelist").getValue()[0].id, "?$select=_transactioncurrencyid_value").then(
                function success(result) {
                    var transactionCurrencyId = result["_transactioncurrencyid_value"];
                    var transactionCurrencyName = result["_transactioncurrencyid_value@OData.Community.Display.V1.FormattedValue"];
                    if (transactionCurrencyId != null) {
                        formContext.getAttribute("transactioncurrencyid").setValue([{ id: transactionCurrencyId, name: transactionCurrencyName, entityType: "transactioncurrency" }]);
                    }
                },
                function (error) {
                    Xrm.Navigation.openAlertDialog({ text: error.message }, { height: 120, width: 260 }).then(function () { });
                }
            );
        }
    }

    function FilteredEquipmentPriceList() {
        let filtered = "";
        let IsDistributor = false;
        let IsCA = false;
        filtered += "<filter type='and'>";
        let account = formContext.getAttribute("parentaccountid") != null ? formContext.getAttribute("parentaccountid").getValue() : null;
        //let currency = Xrm.Page.getAttribute("transactioncurrencyid") != null ? Xrm.Page.getAttribute("transactioncurrencyid").getValue()[0].id : null;
        let deliveryTerm = null, country = null;
        if (account != null) {
            let FetchXml = "";
            FetchXml += "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>";
            FetchXml += "<entity name='account'>";
            FetchXml += "<attribute name='dubois_deliveryterm' />";
            FetchXml += "<attribute name='dubois_relationshiptype' />";
            FetchXml += "<attribute name='dubois_axcustomerid' />";
            FetchXml += "<attribute name='dubois_pricelisttype' />"
            FetchXml += "<filter type='and'>";
            FetchXml += "<condition attribute='accountid' operator='eq' value='" + account[0].id + "' />";
            FetchXml += "</filter>";
            FetchXml += "<link-entity name='dubois_address' from='dubois_addressid' to='dubois_newaddresslookup' link-type='outer' alias='Address' >";
            FetchXml += "<attribute name='dubois_country' />";
            FetchXml += "</link-entity>";
            FetchXml += "</entity>";
            FetchXml += "</fetch>";

            //let accountData = XrmServiceToolkit.Soap.Fetch(FetchXml);
            if (AccountResult != null && AccountResult.entities.length > 0) {
                let accountData = AccountResult.entities[0];
                if (accountData["dubois_relationshiptype"] == 3) {      //3 = Distributor
                    IsDistributor = true;
                }

                if (accountData["Address.dubois_country"] != null) {
                    if (accountData["Address.dubois_country@OData.Community.Display.V1.FormattedValue"] == "US" || accountData["Address.dubois_country@OData.Community.Display.V1.FormattedValue"] == "CA") {
                        if (accountData["Address.dubois_country@OData.Community.Display.V1.FormattedValue"] == "CA") {
                            IsCA = true;
                        }
                        filtered += "<condition attribute='dubois_country' operator='eq' value='" + accountData["Address.dubois_country"] + "' />";
                    }
                    else {
                        if (CountryUSGuid != '') {
                            filtered += "<condition attribute='dubois_country' operator='eq' value='" + CountryUSGuid + "' />";
                        }
                    }
                }
            }

        }
        if (IsDistributor) {
            filtered = "<filter type='and'>";
            if (IsCA) {
                filtered += "<condition attribute='name' operator='eq' value='CA Delivered Price List' />";
            }
            else {
                filtered += "<condition attribute='dubois_pricelistproducttype' operator='eq' value='3' />";
            }
        }
        else {
            filtered += "<condition attribute='dubois_pricelistproducttype' operator='eq' value='2' />";
        }
        //filtered += "<condition attribute='dubois_pricelistproducttype' operator='eq' value='2' />";
        filtered += "<condition attribute='statecode' operator='eq' value='0' />";
        if (formContext.getAttribute("dubois_chemicalpricelist") != null && formContext.getAttribute("dubois_chemicalpricelist").getValue() != null) {
            if (formContext.getAttribute("transactioncurrencyid").getValue() != null) {
                filtered += "<condition attribute='transactioncurrencyid' operator='eq' value='" + formContext.getAttribute("transactioncurrencyid").getValue()[0].id + "' />";
            }
        }
        filtered += "</filter>";
        Xrm.Page.getControl("dubois_equipmentpricelist").addCustomFilter(filtered);
    }

    function OnChangeofEquipmentPriceList() {
        if (formContext == null)
            formContext = executionContext.getFormContext(); // get formContext

        if (Xrm.Page.getAttribute("dubois_equipmentpricelist") != null && Xrm.Page.getAttribute("dubois_equipmentpricelist").getValue() != null) {
            //let Column = ["transactioncurrencyid"];
            //let retrievedResult = XrmServiceToolkit.Soap.Retrieve("pricelevel", Xrm.Page.getAttribute("dubois_equipmentpricelist").getValue()[0].id, Column);
            //if (retrievedResult.attributes["transactioncurrencyid"] != null) {
            //    Xrm.Page.getAttribute("transactioncurrencyid").setValue([{ id: retrievedResult.attributes["transactioncurrencyid"].id, name: retrievedResult.attributes["transactioncurrencyid"].name, entityType: "transactioncurrency" }]);
            //}
            Xrm.WebApi.retrieveRecord("pricelevel", formContext.getAttribute("dubois_equipmentpricelist").getValue()[0].id, "?$select=_transactioncurrencyid_value").then(
                function success(result) {
                    var transactionCurrencyId = result["_transactioncurrencyid_value"];
                    var transactionCurrencyName = result["_transactioncurrencyid_value@OData.Community.Display.V1.FormattedValue"];
                    if (transactionCurrencyId != null) {
                        formContext.getAttribute("transactioncurrencyid").setValue([{ id: transactionCurrencyId, name: transactionCurrencyName, entityType: "transactioncurrency" }]);
                    }
                },
                function (error) {
                    Xrm.Navigation.openAlertDialog({ text: error.message }, { height: 120, width: 260 }).then(function () { });
                }
            );
        }
    }
    function SetPriceListfromAccount(accountId) {
        let pricelistTypeDEL = null;
        let obj = {};
        let IsDistributor = false;
        let IsCA = false;
        obj.EquipmentId = null;
        obj.ChemicalId = null;
        obj.ChemicalName = "";
        obj.EquipmentName = "";
        obj.PriceListType = "";
        let filtered = "";

        filtered += "<filter type='and'>";
        let deliveryTerm = null, country = null
        if (accountId != null) {
            if (AccountResult != null && AccountResult.entities.length > 0) {
                let accountData = AccountResult.entities[0];
                if (typeof accountData["dubois_relationshiptype"] != 'undefined' && accountData["dubois_relationshiptype"] == 3) {      //3 = Distributor
                    IsDistributor = true;
                }

                //if (accountData[0].attributes["Address.dubois_country"] == null || (accountData[0].attributes["Address.dubois_country"] != null && accountData[0].attributes["Address.dubois_country"].name != "CA")) {     //Avoid PriceListType filter for Canada
                if (accountData["dubois_axcustomerid"] != null) {
                    if (typeof accountData["dubois_deliveryterm"] != 'undefined' && accountData["dubois_deliveryterm"] != null && accountData["dubois_deliveryterm"] == "DEL") {
                        //filtered += "<condition attribute='dubois_deliveryterm' operator='eq' value='" + accountData[0].attributes["dubois_deliveryterm"].value + "' />";
                        obj.PriceListType = accountData["dubois_deliveryterm"];
                        pricelistTypeDEL = true;
                    }
                    else if (typeof accountData["dubois_deliveryterm"] != 'undefined' && accountData["dubois_deliveryterm"] != null) {
                        //filtered += "<condition attribute='dubois_deliveryterm' operator='ne' value='DEL' />";
                        obj.PriceListType = accountData["dubois_deliveryterm"];
                        pricelistTypeDEL = false;
                    }
                }
                else {
                    if (typeof accountData["dubois_pricelisttype"] != 'undefined' && accountData["dubois_pricelisttype"] != null && accountData["dubois_pricelisttype"] == 2) {
                        //filtered += "<condition attribute='dubois_deliveryterm' operator='eq' value='DEL' />";
                        obj.PriceListType = accountData["dubois_pricelisttype@OData.Community.Display.V1.FormattedValue"];
                        pricelistTypeDEL = true;
                    }
                    else if (typeof accountData["dubois_pricelisttype"] != 'undefined' && accountData["dubois_pricelisttype"] != null) {
                        //filtered += "<condition attribute='dubois_deliveryterm' operator='ne' value='DEL' />";
                        obj.PriceListType = accountData["dubois_pricelisttype@OData.Community.Display.V1.FormattedValue"];
                        pricelistTypeDEL = false;
                    }
                }
                //}

                if (typeof accountData["Address.dubois_country"] != 'undefined' && accountData["Address.dubois_country"] != null) {
                    if (accountData["Address.dubois_country@OData.Community.Display.V1.FormattedValue"] == "US" || accountData["Address.dubois_country@OData.Community.Display.V1.FormattedValue"] == "CA") {
                        if (accountData["Address.dubois_country@OData.Community.Display.V1.FormattedValue"] == "CA") {
                            IsCA = true;
                        }
                        filtered += "<condition attribute='dubois_country' operator='eq' value='" + accountData["Address.dubois_country"] + "' />";
                    }
                    else {
                        if (CountryUSGuid != '') {
                            filtered += "<condition attribute='dubois_country' operator='eq' value='" + CountryUSGuid + "' />";
                        }
                    }
                }
            }
        }
        //filtered += "<condition attribute='transactioncurrencyid' operator='eq' value='" + currency + "' />";
        filtered += "<condition attribute='statecode' operator='eq' value='0' />";
        filtered += "</filter>";

        let pricelistXml = "";
        if (IsCA == true && IsDistributor == true) {
            pricelistXml += "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>";
            pricelistXml += "  <entity name='pricelevel'>";
            pricelistXml += "    <attribute name='name' />";
            pricelistXml += "    <attribute name='transactioncurrencyid' />";
            pricelistXml += "    <attribute name='statecode' />";
            pricelistXml += "    <attribute name='pricelevelid' />";
            pricelistXml += "    <filter type='or'>";
            pricelistXml += "      <condition attribute='name' operator='eq' value='CA Delivered Price List' />";
            pricelistXml += "    <filter type='and'>";
            pricelistXml += "      <condition attribute='name' operator='like' value='%CA Price Increase' />";
            pricelistXml += filtered
            pricelistXml += "    </filter>";
            pricelistXml += "    </filter>";
            pricelistXml += "  </entity>";
            pricelistXml += "</fetch>";
        }
        else {
            pricelistXml += "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>";
            pricelistXml += "<entity name='pricelevel'>";
            pricelistXml += "<attribute name='pricelevelid' />";
            pricelistXml += "<attribute name='dubois_deliveryterm' />";
            pricelistXml += "<attribute name='name' />";
            pricelistXml += "<attribute name='dubois_pricelistproducttype' />";
            pricelistXml += filtered
            pricelistXml += "</entity>";
            pricelistXml += "</fetch>";
        }

        //let pricelistData = XrmServiceToolkit.Soap.Fetch(pricelistXml);
        console.log(pricelistXml);
        pricelistXml = "?fetchXml=" + encodeURIComponent(pricelistXml);

        Xrm.WebApi.retrieveMultipleRecords("pricelevel", pricelistXml).then(
            function success(result) {
                //if (result.entities.length === 1) {
                let pricelistData = result.entities;
                //formContext.getAttribute("dubois_equipmentpricelist").setValue([{ id: pricelistRecord.pricelevelid, name: pricelistRecord.name, entityType: "pricelevel" }]);
                //formContext.getControl("dubois_equipmentpricelist").setDisabled(true);
                if (IsDistributor) {
                    let distributorResult = pricelistData.filter(function (item) {
                        if (item["dubois_pricelistproducttype"] != null)
                            return (item["dubois_pricelistproducttype"] == 3
                                || (item["name"] != null && item["name"].indexOf('Price Increase') != -1))
                    });

                    if (pricelistData.length == 1 && IsDistributor && IsCA) {
                        obj.EquipmentId = pricelistData[0].pricelevelid
                        obj.EquipmentName = pricelistData[0]["name"] != null ? pricelistData[0]["name"] : "";

                        obj.ChemicalId = pricelistData[0].pricelevelid
                        obj.ChemicalName = pricelistData[0]["name"] != null ? pricelistData[0]["name"] : "";

                    } else {
                        if (distributorResult.length == 1) {
                            obj.EquipmentId = distributorResult[0].pricelevelid
                            obj.EquipmentName = distributorResult[0]["name"] != null ? distributorResult[0]["name"] : "";

                            obj.ChemicalId = distributorResult[0].pricelevelid
                            obj.ChemicalName = distributorResult[0]["name"] != null ? distributorResult[0]["name"] : "";
                        }
                    }
                }
                else {
                    let equipmentResult = pricelistData.filter(function (item) {
                        if (item["dubois_pricelistproducttype"] != null)
                            return item["dubois_pricelistproducttype"] == 2
                    });
                    let chemicalResult = pricelistData.filter(function (item) {
                        if (item["dubois_pricelistproducttype"] != null)
                            return item["dubois_pricelistproducttype"] == 1 &&
                                (
                                    pricelistTypeDEL == null
                                    || (item["name"] != null && item["name"].indexOf('Price Increase') != -1)
                                    || (pricelistTypeDEL == true && item["dubois_deliveryterm"] != null && item["dubois_deliveryterm"] == "DEL")
                                    || (pricelistTypeDEL == false && (item["dubois_deliveryterm"] == null || item["dubois_deliveryterm"] != "DEL")
                                    ))
                    });

                    if (equipmentResult.length == 1) {
                        obj.EquipmentId = equipmentResult[0].pricelevelid
                        obj.EquipmentName = equipmentResult[0]["name"] != null ? equipmentResult[0]["name"] : "";
                    }
                    if (chemicalResult.length == 1) {
                        obj.ChemicalId = chemicalResult[0].pricelevelid
                        obj.ChemicalName = chemicalResult[0]["name"] != null ? chemicalResult[0]["name"] : "";
                    }
                }
                //}
                //let obj = GetPriceListfromAccount(formContext.getAttribute("parentaccountid").getValue()[0].id);
                formContext.getAttribute("dubois_pricelisttype").setValue(obj.PriceListType);
                if (obj.EquipmentId != null) {
                    formContext.getAttribute("dubois_equipmentpricelist").setValue([{ id: obj.EquipmentId, name: obj.EquipmentName, entityType: "pricelevel" }]);
                }
                if (obj.ChemicalId != null) {
                    formContext.getAttribute("dubois_chemicalpricelist").setValue([{ id: obj.ChemicalId, name: obj.ChemicalName, entityType: "pricelevel" }]);
                }
            },
            function (error) {
                Xrm.Navigation.openAlertDialog({ text: error.message }, { height: 120, width: 260 }).then(function () { });
            }
        );
    }

    function GetPriceListfromAccount(accountId) {
        let company = 'DCU';
        let pricelistTypeDEL = null;
        let obj = {};
        let IsDistributor = false;
        let IsCA = false;
        obj.EquipmentId = null;
        obj.ChemicalId = null;
        obj.ChemicalName = "";
        obj.EquipmentName = "";
        obj.PriceListType = "";
        let filtered = "";

        filtered += "<filter type='and'>";
        //let currency = Xrm.Page.getAttribute("transactioncurrencyid") != null ? Xrm.Page.getAttribute("transactioncurrencyid").getValue()[0].id : null;
        let deliveryTerm = null, country = null
        if (accountId != null) {
            let FetchXml = "";
            FetchXml += "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>";
            FetchXml += "<entity name='account'>";
            FetchXml += "<attribute name='msdyn_company' />";
            FetchXml += "<attribute name='dubois_deliveryterm' />";
            FetchXml += "<attribute name='dubois_relationshiptype' />";
            FetchXml += "<attribute name='dubois_axcustomerid' />";
            FetchXml += "<attribute name='dubois_pricelisttype' />"
            FetchXml += "<filter type='and'>";
            FetchXml += "<condition attribute='accountid' operator='eq' value='" + accountId + "' />";
            FetchXml += "</filter>";
            FetchXml += "<link-entity name='dubois_address' from='dubois_addressid' to='dubois_newaddresslookup' link-type='outer' alias='Address' >";
            FetchXml += "<attribute name='dubois_country' />";
            FetchXml += "</link-entity>";
            FetchXml += "</entity>";
            FetchXml += "</fetch>";
            let accountData = XrmServiceToolkit.Soap.Fetch(FetchXml);
            if (accountData != null && accountData.length > 0) {

                if (accountData[0].attributes["dubois_relationshiptype"].value == 3) {      //3 = Distributor
                    IsDistributor = true;
                }

                //if (accountData[0].attributes["Address.dubois_country"] == null || (accountData[0].attributes["Address.dubois_country"] != null && accountData[0].attributes["Address.dubois_country"].name != "CA")) {     //Avoid PriceListType filter for Canada
                if (accountData[0].attributes["dubois_axcustomerid"] != null) {
                    if (accountData[0].attributes["dubois_deliveryterm"] != null && accountData[0].attributes["dubois_deliveryterm"].value == "DEL") {
                        //filtered += "<condition attribute='dubois_deliveryterm' operator='eq' value='" + accountData[0].attributes["dubois_deliveryterm"].value + "' />";
                        obj.PriceListType = accountData[0].attributes["dubois_deliveryterm"].value;
                        pricelistTypeDEL = true;
                    }
                    else if (accountData[0].attributes["dubois_deliveryterm"] != null) {
                        //filtered += "<condition attribute='dubois_deliveryterm' operator='ne' value='DEL' />";
                        obj.PriceListType = accountData[0].attributes["dubois_deliveryterm"].value;
                        pricelistTypeDEL = false;
                    }
                }
                else {
                    if (accountData[0].attributes["dubois_pricelisttype"] != null && accountData[0].attributes["dubois_pricelisttype"].value == 2) {
                        //filtered += "<condition attribute='dubois_deliveryterm' operator='eq' value='DEL' />";
                        obj.PriceListType = accountData[0].attributes["dubois_pricelisttype"].formattedValue;
                        pricelistTypeDEL = true;
                    }
                    else if (accountData[0].attributes["dubois_pricelisttype"] != null) {
                        //filtered += "<condition attribute='dubois_deliveryterm' operator='ne' value='DEL' />";
                        obj.PriceListType = accountData[0].attributes["dubois_pricelisttype"].formattedValue;
                        pricelistTypeDEL = false;
                    }
                }
                //}
                //if (accountData[0]["_msdyn_company_value"] != null) {
                //    IsCA = company == 'DCC';
                //    company = accountData[0]["_msdyn_company_value@OData.Community.Display.V1.FormattedValue"];
                //    filtered += "<condition attribute='dubois_countryname' operator='like' value='" + (company == 'DCC' ? 'CA%' : 'US%') + "' />";
                //}
                if (accountData[0].attributes["msdyn_company"] != null) {
                    company = accountData[0].attributes["msdyn_company"].name;
                    IsCA = company == 'DCC';
                    filtered += "<condition attribute='dubois_countryname' operator='like' value='" + (company == 'DCC' ? 'CA%' : 'US%') + "' />";
                }
                //if (accountData[0].attributes["Address.dubois_country"] != null) {
                //    if (accountData[0].attributes["Address.dubois_country"].name == "US" || accountData[0].attributes["Address.dubois_country"].name == "CA") {
                //        if (accountData[0].attributes["Address.dubois_country"].name == "CA") {
                //            IsCA = true;
                //        }
                //        filtered += "<condition attribute='dubois_country' operator='eq' value='" + accountData[0].attributes["Address.dubois_country"].id + "' />";
                //    }
                //    else {
                //        let FetchXml1 = "";
                //        FetchXml1 += "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>";
                //        FetchXml1 += "  <entity name='dubois_country'>";
                //        FetchXml1 += "    <attribute name='dubois_name' />";
                //        FetchXml1 += "    <attribute name='dubois_countryid' />";
                //        FetchXml1 += "    <filter type='and'>";
                //        FetchXml1 += "      <condition attribute='dubois_name' operator='eq' value='US' />";
                //        FetchXml1 += "    </filter>";
                //        FetchXml1 += "  </entity>";
                //        FetchXml1 += "</fetch>";
                //        let countryData = XrmServiceToolkit.Soap.Fetch(FetchXml1);

                //        filtered += "<condition attribute='dubois_country' operator='eq' value='" + countryData[0].attributes["dubois_countryid"].value + "' />";
                //    }
                //}
            }
        }
        //filtered += "<condition attribute='transactioncurrencyid' operator='eq' value='" + currency + "' />";
        filtered += "<condition attribute='statecode' operator='eq' value='0' />";
        filtered += "</filter>";

        let pricelistXml = "";
        if (IsCA == true && IsDistributor == true) {
            pricelistXml += "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>";
            pricelistXml += "  <entity name='pricelevel'>";
            pricelistXml += "    <attribute name='name' />";
            pricelistXml += "    <attribute name='transactioncurrencyid' />";
            pricelistXml += "    <attribute name='statecode' />";
            pricelistXml += "    <attribute name='pricelevelid' />";
            pricelistXml += "    <filter type='or'>";
            pricelistXml += "      <condition attribute='name' operator='eq' value='CA Prepaid Price List' />";
            pricelistXml += "    <filter type='and'>";
            pricelistXml += "      <condition attribute='name' operator='like' value='%Price Increase' />";
            pricelistXml += filtered
            pricelistXml += "    </filter>";
            pricelistXml += "    </filter>";
            pricelistXml += "  </entity>";
            pricelistXml += "</fetch>";
        }
        else {
            pricelistXml += "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>";
            pricelistXml += "<entity name='pricelevel'>";
            pricelistXml += "<attribute name='pricelevelid' />";
            pricelistXml += "<attribute name='dubois_deliveryterm' />";
            pricelistXml += "<attribute name='name' />";
            pricelistXml += "<attribute name='dubois_pricelistproducttype' />";
            pricelistXml += filtered
            pricelistXml += "</entity>";
            pricelistXml += "</fetch>";
        }

        let pricelistData = XrmServiceToolkit.Soap.Fetch(pricelistXml);
        if (IsDistributor) {
            let distributorResult = pricelistData.filter(function (item) {
                if (item.attributes["dubois_pricelistproducttype"] != null)
                    return (item.attributes["dubois_pricelistproducttype"].value == 3
                        || (item.attributes["name"] != null && item.attributes["name"].value.indexOf('Price Increase') != -1))
            });

            if (pricelistData.length == 1 && IsDistributor && IsCA) {
                obj.EquipmentId = pricelistData[0].id
                obj.EquipmentName = pricelistData[0].attributes["name"] != null ? pricelistData[0].attributes["name"].value : "";

                obj.ChemicalId = pricelistData[0].id
                obj.ChemicalName = pricelistData[0].attributes["name"] != null ? pricelistData[0].attributes["name"].value : "";

            } else {
                if (distributorResult.length == 1) {
                    obj.EquipmentId = distributorResult[0].id
                    obj.EquipmentName = distributorResult[0].attributes["name"] != null ? distributorResult[0].attributes["name"].value : "";

                    obj.ChemicalId = distributorResult[0].id
                    obj.ChemicalName = distributorResult[0].attributes["name"] != null ? distributorResult[0].attributes["name"].value : "";
                }
            }
        }
        else {
            let equipmentResult = pricelistData.filter(function (item) {
                if (item.attributes["dubois_pricelistproducttype"] != null)
                    return item.attributes["dubois_pricelistproducttype"].value == 2
            });
            let chemicalResult = pricelistData.filter(function (item) {
                if (item.attributes["dubois_pricelistproducttype"] != null)
                    return item.attributes["dubois_pricelistproducttype"].value == 1 &&
                        (
                            pricelistTypeDEL == null
                            || (item.attributes["name"] != null && item.attributes["name"].value.indexOf('Price Increase') != -1)
                            || (pricelistTypeDEL == true && item.attributes["dubois_deliveryterm"] != null && item.attributes["dubois_deliveryterm"].value == "DEL")
                            || (pricelistTypeDEL == false && (item.attributes["dubois_deliveryterm"] == null || item.attributes["dubois_deliveryterm"].value != "DEL")
                            ))
            });

            if (equipmentResult.length == 1) {
                obj.EquipmentId = equipmentResult[0].id
                obj.EquipmentName = equipmentResult[0].attributes["name"] != null ? equipmentResult[0].attributes["name"].value : "";
            }
            if (chemicalResult.length == 1) {
                obj.ChemicalId = chemicalResult[0].id
                obj.ChemicalName = chemicalResult[0].attributes["name"] != null ? chemicalResult[0].attributes["name"].value : "";
            }
        }
        return obj;
    }

    function CallOnChangeofPERequired(executionContext) {
        if (formContext == null)
            formContext = executionContext.getFormContext(); // get formContext
        if (formContext.ui.tabs.get("QUOTES")) {
            if (formContext.getAttribute("dubois_perequired") && formContext.getAttribute("dubois_perequired").getValue() != null && formContext.getAttribute("dubois_perequired").getValue() == true)
                formContext.ui.tabs.get("QUOTES").setVisible(true);
            else
                formContext.ui.tabs.get("QUOTES").setVisible(false);
        }
    }

    function ShowHideWinProbField() {
        setControlVisible("dubois_winprobability", false);
        setControlVisible("dubois_proposalwinprobability", false);
        setControlVisible("dubois_trialwinprobability", false);
        setControlVisible("dubois_closingwinprobability", false);
        let stagename = "";
        if (formContext.data.process != null) {
            if (formContext.data.process.getActiveStage() != null) {
                stagename = formContext.data.process.getActiveStage().getName();
                CurrentStageNo = StageOrder[stagename];
            }
        }
        if (stagename != "" && StageName[stagename] && formContext.getAttribute("dubois_opportunitytype").getValue() != 1) {
            setControlVisible(StageName[stagename], true);
        }
    }

    function CallOnChangeofStage(executionContext) {
        if (formContext == null)
            formContext = executionContext.getFormContext(); // get formContext
        let stagename = "";
        if (formContext.data.process != null && formContext.data.process.getActiveStage() != null) {
            stagename = formContext.data.process.getActiveStage().getName();
            let StageNo = StageOrder[stagename];
            if (CurrentStageNo < StageNo) {
                if ("Closing" == stagename && formContext.getAttribute("dubois_requiredtrial").getValue() == false) {
                    if (StageOrderWiseName[(StageNo - 2)] != null && formContext.getAttribute(StageOrderWiseName[(StageNo - 2)]) != null) {
                        formContext.getAttribute(StageName[stagename]).setValue(formContext.getAttribute(StageOrderWiseName[(StageNo - 2)]).getValue());
                    }
                }
                else if (StageOrderWiseName[(StageNo - 1)] != null && formContext.getAttribute(StageOrderWiseName[(StageNo - 1)]) != null) {
                    formContext.getAttribute(StageName[stagename]).setValue(formContext.getAttribute(StageOrderWiseName[(StageNo - 1)]).getValue());
                }
                if (StageProbability[stagename])
                    formContext.getAttribute("closeprobability").setValue(StageProbability[stagename]);
                formContext.data.entity.save();
            }

            //CalculateLossProbability(StageName[stagename]); // Move this calculation to plugin[CalculateMonthandAnnualPotentialValues]
            ShowHideWinProbField();

            CallOnChnageofBPFStages(stagename);
            applyApprovalStageLocks();
        }
    };

    function CallOnChnageofBPFStages(stagename) {
        if (stagename == "Discovery") {
            formContext.getAttribute("dubois_salesrep").setRequiredLevel("none");
            //Xrm.Page.getAttribute("customerneed").setRequiredLevel("required");
            //Xrm.Page.getAttribute("proposedsolution").setRequiredLevel("required");
            formContext.getAttribute("estimatedclosedate").setRequiredLevel("none");
            //Xrm.Page.getAttribute("campaignid").setRequiredLevel("required");
            formContext.getAttribute("dubois_trialdate").setRequiredLevel("none");
            formContext.getAttribute("dubois_trialloutcomesnew").setRequiredLevel("none");
            formContext.getAttribute("dubois_trialpaymenttype").setRequiredLevel("none");
            formContext.getAttribute("dubois_trialplanningnew").setRequiredLevel("none");
        }
        if (stagename == "Technical Evaluation") {
            formContext.getAttribute("dubois_salesrep").setRequiredLevel("none");
            //Xrm.Page.getAttribute("customerneed").setRequiredLevel("none");
            //Xrm.Page.getAttribute("proposedsolution").setRequiredLevel("none");
            formContext.getAttribute("estimatedclosedate").setRequiredLevel("required");
            //Xrm.Page.getAttribute("campaignid").setRequiredLevel("none");
            formContext.getAttribute("dubois_trialdate").setRequiredLevel("none");
            formContext.getAttribute("dubois_trialloutcomesnew").setRequiredLevel("none");
            formContext.getAttribute("dubois_trialpaymenttype").setRequiredLevel("none");
            formContext.getAttribute("dubois_trialplanningnew").setRequiredLevel("none");
        }
        if (stagename == "Trial") {
            formContext.getAttribute("dubois_salesrep").setRequiredLevel("none");
            //Xrm.Page.getAttribute("customerneed").setRequiredLevel("none");
            //Xrm.Page.getAttribute("proposedsolution").setRequiredLevel("none");
            formContext.getAttribute("estimatedclosedate").setRequiredLevel("none");
            //Xrm.Page.getAttribute("campaignid").setRequiredLevel("none");
            formContext.getAttribute("dubois_trialdate").setRequiredLevel("required");
            formContext.getAttribute("dubois_trialloutcomesnew").setRequiredLevel("required");
            formContext.getAttribute("dubois_trialpaymenttype").setRequiredLevel("required");
            formContext.getAttribute("dubois_trialplanningnew").setRequiredLevel("required");
        }
        if (stagename == "Closing") {
            formContext.getAttribute("dubois_salesrep").setRequiredLevel("none");
            //Xrm.Page.getAttribute("customerneed").setRequiredLevel("none");
            //Xrm.Page.getAttribute("proposedsolution").setRequiredLevel("none");
            formContext.getAttribute("estimatedclosedate").setRequiredLevel("none");
            //Xrm.Page.getAttribute("campaignid").setRequiredLevel("none");
            formContext.getAttribute("dubois_trialdate").setRequiredLevel("none");
            formContext.getAttribute("dubois_trialloutcomesnew").setRequiredLevel("none");
            formContext.getAttribute("dubois_trialpaymenttype").setRequiredLevel("none");
            formContext.getAttribute("dubois_trialplanningnew").setRequiredLevel("none");
        }
    }

    function setAccountType() {
        if (formContext == null)
            formContext = executionContext.getFormContext(); // get formContext
        var account = formContext.getAttribute("parentaccountid") != null ? formContext.getAttribute("parentaccountid").getValue() : null;
        if (account != null) {
            Xrm.WebApi.retrieveRecord("account", account[0].id, "?$select=dubois_relationshiptype").then(
                function success(result) {
                    formContext.getAttribute("dubois_accounttype").setValue(result["dubois_relationshiptype"]);
                },
                function (error) {
                    Xrm.Navigation.openAlertDialog({ text: error.message }, { height: 120, width: 260 }).then(function () { });
                }
            );
        }
    }

    function AddPreFilterOnAccountLookup(executionContext) {
        if (formContext == null)
            formContext = executionContext.getFormContext(); // get formContext
        //Xrm.Page.getControl("parentaccountid").addPreSearch(AddLookupFilterforAccount);
    }

    function AddLookupFilterforAccount() {
        let filter = "    <filter type='and'>" +
            "      <condition attribute='statecode' operator='eq' value='0' />" +
            "      <condition attribute='dubois_relationshiptype' operator='ne' value='1' />" +
            "    </filter>";
        formContext.getControl("parentaccountid").addCustomFilter(filter);
    }

    function FilterContactgirdOnselectedAccount() {
        //if (Xrm.Page.getAttribute("Contact") != null) {
        //    if (Xrm.Page.getAttribute("parentaccountid") != nullXrm.Page.getAttribute("parentaccountid").getValue() != null) {
        //        let parentaccount = Xrm.Page.getAttribute("parentaccountid").getValue();
        //        if (parentaccount != null) {
        //            var filter = "<filter type='and'>" +
        //                "<condition attribute='parentcustomerid' operator='eq' value='" + parentaccount[0].id + "' />" +
        //                "</filter>";
        //            Xrm.Page.getControl("parentcontactid").addCustomFilter(filter);
        //        }
        //    }
        //}
    }

    function addPreFilterContactLookup(executionContext) {
        if (formContext == null)
            formContext = executionContext.getFormContext(); // get formContext
        formContext.getControl("parentcontactid").addPreSearch(addLookupFilterForMainAcc);
        if (formContext.getControl("header_process_parentcontactid"))
            formContext.getControl("header_process_parentcontactid").addPreSearch(addLookupFilterForMainAcc);
    }

    function addLookupFilterForMainAcc(executionContext) {
        if (formContext == null)
            formContext = executionContext.getFormContext(); // get formContext
        let parentaccount = formContext.getAttribute("parentaccountid").getValue();
        if (parentaccount != null) {
            var filter = "<filter type='and'>" +
                "<condition attribute='parentcustomerid' operator='eq' value='" + parentaccount[0].id + "' />" +
                "</filter>";
            formContext.getControl("parentcontactid").addCustomFilter(filter);
            if (formContext.getControl("header_process_parentcontactid"))
                formContext.getControl("header_process_parentcontactid").addCustomFilter(filter);
        }
    }

    function setParentAccountOnContactChange(executionContext) {
        formContext = executionContext.getFormContext(); // get formContext
        let parentcontact = formContext.getAttribute("parentcontactid").getValue();
        if (parentcontact != null) {
            fetchParentAccountOfContact(parentcontact[0].id);
        }
    }

    function fetchParentAccountOfContact(contactid) {
        Xrm.WebApi.retrieveRecord("contact", contactid, "?$select=_parentcustomerid_value").then(
            function success(result) {
                let accId = result["_parentcustomerid_value"];
                if (accId != null) {
                    let lookup = new Array();
                    lookup[0] = {};
                    lookup[0].id = accId;
                    lookup[0].entityType = "account";
                    lookup[0].name = result["_parentcustomerid_value@OData.Community.Display.V1.FormattedValue"];
                    formContext.getAttribute("parentaccountid").setValue(lookup);
                }
            },
            function (error) {
                Xrm.Navigation.openAlertDialog({ text: error.message }, { height: 120, width: 260 }).then(function () { });
            }
        );
    }

    function clearParentContactOnAccountChange(executionContext) {
        formContext = executionContext.getFormContext(); // get formContext
        formContext.getAttribute("dubois_pricelisttype").setValue("");
        if (formContext.getControl("dubois_chemicalpricelist") != null) {
            formContext.getControl("dubois_chemicalpricelist").setDisabled(false);
            formContext.getAttribute("dubois_chemicalpricelist").setValue(null);
        }
        if (formContext.getControl("dubois_equipmentpricelist") != null) {
            formContext.getControl("dubois_equipmentpricelist").setDisabled(false);
            formContext.getAttribute("dubois_equipmentpricelist").setValue(null);
        }

        if (formContext.getAttribute("parentaccountid").getValue() != null && formContext.getAttribute("parentcontactid").getValue() != null) {
            let currentAccount = formContext.getAttribute("parentaccountid").getValue()[0].id;
            let currentContact = formContext.getAttribute("parentcontactid").getValue()[0].id;

            Xrm.WebApi.retrieveRecord("contact", currentContact, "?$select=_parentcustomerid_value").then(
                function success(result) {
                    if (result["_parentcustomerid_value"] !== null) {
                        if (result["_parentcustomerid_value"] == currentAccount.replace("{", "").replace("}", "").toLowerCase()) {
                            return;
                        }
                    }
                    formContext.getAttribute("parentcontactid").setValue(null);
                },
                function (error) {
                    Xrm.Navigation.openAlertDialog({ text: error.message }, { height: 120, width: 260 }).then(function () { });
                }
            );
        }
    }

    //function OnChangeofCurrency() {
    //    Xrm.Page.getAttribute("dubois_equipmentpricelist").setValue(null);
    //    Xrm.Page.getAttribute("dubois_chemicalpricelist").setValue(null);
    //}

    function CalculateMonthlyValue() {
        //let AnnualValue = 0;
        //if (Xrm.Page.getAttribute("dubois_annualvalue") != null && Xrm.Page.getAttribute("dubois_annualvalue").getValue() != null)
        //    AnnualValue = Xrm.Page.getAttribute("dubois_annualvalue").getValue();

        //let MonthlyValue = AnnualValue / 12;
        //Xrm.Page.getAttribute("dubois_monthlyvalue").setValue(MonthlyValue);
        //CalculateProbability();
    }

    function CalculateyearlyValue() {
        //let MonthlyValue = 0;
        //if (Xrm.Page.getAttribute("dubois_monthlyvalue") != null && Xrm.Page.getAttribute("dubois_monthlyvalue").getValue() != null)
        //    MonthlyValue = Xrm.Page.getAttribute("dubois_monthlyvalue").getValue();

        //let AnnualValue = MonthlyValue * 12;
        //Xrm.Page.getAttribute("dubois_annualvalue").setValue(AnnualValue);
        //CalculateProbability();
    }

    //function CalculateLossProbability(FieldName) {
    //    //let WinProbability = 0;
    //    //if (Xrm.Page.getAttribute(FieldName) != null && Xrm.Page.getAttribute(FieldName).getValue() != null)
    //    //    WinProbability = Xrm.Page.getAttribute(FieldName).getValue();

    //    //let LossProbability = 100 - WinProbability;
    //    //Xrm.Page.getAttribute("dubois_lossprobability").setValue(LossProbability);
    //    //CalculateProbability();
    //}

    //function CalculateProbability() {
    //    //let stagename = "";
    //    //if (Xrm.Page.data.process != null) {
    //    //    stagename = Xrm.Page.data.process.getActiveStage().getName();
    //    //}
    //    //let WinProbability = Xrm.Page.getAttribute(StageName[stagename]).getValue();
    //    //let LossProbability = Xrm.Page.getAttribute("dubois_lossprobability").getValue();
    //    //let MonthValue = Xrm.Page.getAttribute("dubois_monthlyvalue").getValue();
    //    //let YearValue = Xrm.Page.getAttribute("dubois_annualvalue").getValue();
    //    //let ValueType = Xrm.Page.getAttribute("dubois_valuetype").getValue();

    //    //let WinForecast = 0, NetForecast = 0, LossForecast = 0;

    //    //if (YearValue != null && WinProbability != null)
    //    //    WinForecast = (YearValue * WinProbability) / 100;
    //    //if (YearValue != null && LossProbability != null)
    //    //    LossForecast = (YearValue * LossProbability) / 100;
    //    //if (ValueType != 1)
    //    //    NetForecast = WinForecast - LossForecast;
    //    //else
    //    //    NetForecast = WinForecast;

    //    //Xrm.Page.getAttribute("dubois_winforecast").setValue(WinForecast);
    //    //Xrm.Page.getAttribute("dubois_lossforecast").setValue(LossForecast);
    //    //Xrm.Page.getAttribute("dubois_netforecast").setValue(NetForecast);
    //}

    function MonthlyCalculation(executionContext, IndustrialMonthlyValue, IndustrialAnnualValue) {
        formContext = executionContext.getFormContext(); // get formContext
        let ChangeValue = 0;
        if (formContext.getAttribute(IndustrialMonthlyValue).getValue() != null)
            ChangeValue = formContext.getAttribute(IndustrialMonthlyValue).getValue();
        else
            formContext.getAttribute(IndustrialMonthlyValue).setValue(0);

        formContext.getAttribute(IndustrialAnnualValue).setValue((ChangeValue * 12));
    }

    function AnnualCalculation(executionContext, IndustrialAnnualValue, IndustrialMonthlyValue) {
        formContext = executionContext.getFormContext(); // get formContext
        let ChangeValue = 0;
        if (formContext.getAttribute(IndustrialAnnualValue).getValue() != null)
            ChangeValue = formContext.getAttribute(IndustrialAnnualValue).getValue();
        else
            formContext.getAttribute(IndustrialAnnualValue).setValue(0);

        formContext.getAttribute(IndustrialMonthlyValue).setValue((ChangeValue / 12));
    }

    function CallonAddQuote(SEntitytypename, PEntitytypename, FPId, PControl, SControl) {
        SControl = Common.resolveControlName(SControl);
        if (PEntitytypename == "opportunity" && SControl.controlName == "Equipment") {
            CreateQuote(1, "Equipment");
        }
        else if (PEntitytypename == "opportunity" && SControl.controlName == "Chemical") {
            CreateQuote(2, "Chemical");
            //var parameters = {};
            //parameters["indusa_type"] = "4";
            //parameters["indusa_startdate"] = Xrm.Page.getAttribute("indusa_startdateweek1").getValue().format("MM/dd/yyyy");
            //parameters["indusa_enddate"] = Xrm.Page.getAttribute("indusa_enddateweek1").getValue().format("MM/dd/yyyy");
            //parameters["indusa_totaltime"] = Xrm.Page.getAttribute("indusa_timeweek1").getValue();

            //parameters["name"]= "4";
            //parameters["opportunityid"] = Xrm.Page.data.entity.getId();
            //parameters["opportunityidname"] = Xrm.Page.getAttribute("indusa_project").getValue()[0].name;

            //parameters["pricelevelid"] = Xrm.Page.getAttribute("indusa_project").getValue()[0].id;
            //parameters["pricelevelidname"] = Xrm.Page.getAttribute("indusa_project").getValue()[0].name;

            //parameters["customerid"] = Xrm.Page.getAttribute("indusa_project").getValue()[0].id;
            //parameters["customeridname"] = Xrm.Page.getAttribute("indusa_project").getValue()[0].name;

            //var windowOptions = { openInNewWindow: true };

            //Xrm.Utility.openEntityForm("quote", null, parameters, windowOptions);
        }
        else if (PEntitytypename == "account" && SControl.controlName == "ACC_Equipment") {
            CreateQuotefromAccount(1, "ACC_Equipment");
        }
        else if (PEntitytypename == "account" && SControl.controlName == "ACC_Chemical") {
            CreateQuotefromAccount(2, "ACC_Chemical");
        }
        else if (PEntitytypename == "contact" && SControl.controlName == "Contact_EquipmentPE") {
            CreateQuotefromContact(1, "Contact_EquipmentPE");
        }
        else if (PEntitytypename == "contact" && SControl.controlName == "Contact_ChemicalPE") {
            CreateQuotefromContact(2, "Contact_ChemicalPE");
        }
        else if (PEntitytypename == "incident" && SControl.controlName == "PriceException") {
            CreateQuotefromCase(1, "PriceException");
        }
        else if (PEntitytypename == "incident" && SControl.controlName == "priceexceptionchemical") {
            CreateQuotefromCase(2, "priceexceptionchemical");
        }
        else {
            //Sales/Quote/Quote_main_system_library.js
            //Mscrm.QuoteGridCommandActions.addNewFromSubGridStandard
            Mscrm.QuoteGridCommandActions.addNewFromSubGridStandard(SEntitytypename, PEntitytypename, FPId, PControl, SControl);
        }

    }

    function CallonAddOpportunityProduct(SEntitytypename, PEntitytypename, FPId, PControl, SControl) {
        var parameters = {};
        parameters["opportunityid"] = Xrm.Page.data.entity.getId();
        SControl = Common.resolveControlName(SControl);
        if (PEntitytypename == "opportunity" && SControl.controlName == "OpEquipment") {
            parameters["dubois_producttype"] = "1";
            if (Xrm.Page.getAttribute("dubois_equipmentpricelist").getValue() != null) {
                parameters["dubois_pricelist"] = Xrm.Page.getAttribute("dubois_equipmentpricelist").getValue()[0].id;
                parameters["dubois_pricelistname"] = Xrm.Page.getAttribute("dubois_equipmentpricelist").getValue()[0].name;
            }
            if (Xrm.Page.getAttribute("transactioncurrencyid").getValue() != null) {
                parameters["transactioncurrencyid"] = Xrm.Page.getAttribute("transactioncurrencyid").getValue()[0].id;
                parameters["transactioncurrencyidname"] = Xrm.Page.getAttribute("transactioncurrencyid").getValue()[0].name;
            }
            Xrm.Utility.openEntityForm("opportunityproduct", null, parameters);
        }
        else if (PEntitytypename == "opportunity" && SControl.controlName == "OpChemical") {
            parameters["dubois_producttype"] = "2";
            if (Xrm.Page.getAttribute("dubois_chemicalpricelist").getValue() != null) {
                parameters["dubois_pricelist"] = Xrm.Page.getAttribute("dubois_chemicalpricelist").getValue()[0].id;
                parameters["dubois_pricelistname"] = Xrm.Page.getAttribute("dubois_chemicalpricelist").getValue()[0].name;
            }
            if (Xrm.Page.getAttribute("transactioncurrencyid").getValue() != null) {
                parameters["transactioncurrencyid"] = Xrm.Page.getAttribute("transactioncurrencyid").getValue()[0].id;
                parameters["transactioncurrencyidname"] = Xrm.Page.getAttribute("transactioncurrencyid").getValue()[0].name;
            }
            Xrm.Utility.openEntityForm("opportunityproduct", null, parameters);
        }
        else {
            //$webresource: msdyn_ / Opportunity / Opportunity.Library.js
            //FS.Opportunity.Library.AddNewServiceLine
            FS.Opportunity.Library.AddNewServiceLine(SEntitytypename, PEntitytypename, FPId, PControl, SControl);
        }
    }

    function CreateQuote(Form, GridName) {
        var createRecord = new XrmServiceToolkit.Soap.BusinessEntity("quote");
        if (Xrm.Page.getAttribute("parentaccountid") != null && Xrm.Page.getAttribute("parentaccountid").getValue() != null) {
            createRecord.attributes["customerid"] = {
                id: Xrm.Page.getAttribute("parentaccountid").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'account'
            }
            let obj = getAccountData(Xrm.Page.getAttribute("parentaccountid").getValue()[0].id);
            createRecord.attributes["dubois_estimatedcurrentyeartotalsales"] = {
                value: obj.YTD,
                type: 'Money'
            }
            createRecord.attributes["dubois_prioryeartotalsales"] = {
                value: obj.Trailing,
                type: 'Money'
            }
            createRecord.attributes["dubois_corporatecustomer"] = obj.CorporateCust;

            createRecord.attributes["dubois_mtdrevenue"] = {
                value: obj.MTD,
                type: 'Money'
            }
            createRecord.attributes["dubois_openorder"] = {
                value: obj.OpenOrder,
                type: 'Money'
            }
            createRecord.attributes["dubois_lysamemonthrevenue"] = {
                value: obj.LYPerMonth,
                type: 'Money'
            }
            createRecord.attributes["dubois_lytdrevenue"] = {
                value: obj.LYTD,
                type: 'Money'
            }

            createRecord.attributes["dubois_servicetechnician"] = obj.TechRep;
            createRecord.attributes["dubois_technicalspecialist"] = obj.SAE;
            createRecord.attributes["dubois_rdcontact"] = obj.RND;
            createRecord.attributes["dubois_additionalrep"] = obj.AdditionRep;
            createRecord.attributes["dubois_salesrepresentative"] = obj.SalesRep;
            createRecord.attributes["dubois_manager"] = obj.Manager;
            createRecord.attributes["dubois_rvpapprover"] = obj.rvp;
            createRecord.attributes["dubois_techadviser"] = obj.TechAdviser;
            createRecord.attributes["dubois_customeraccountnumber"] = obj.AXCustomerId;
            createRecord.attributes["dubois_primaryaddresss"] = obj.PrimaryAddress;

            //if (obj.Pricelist != null) {
            //    createRecord.attributes["pricelevelid"] = {
            //        id: obj.Pricelist,
            //        type: 'EntityReference',
            //        logicalName: 'pricelevel'
            //    }
            //}
        }
        if (Xrm.Page.getAttribute("parentcontactid").getValue() != null) {
            createRecord.attributes["dubois_contact"] = {
                id: Xrm.Page.getAttribute("parentcontactid").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'contact'
            }
        }
        createRecord.attributes["name"] = Xrm.Page.getAttribute("name").getValue();
        createRecord.attributes["dubois_requesttype"] = {
            value: Form,
            type: 'OptionSetValue'
        }
        createRecord.attributes["opportunityid"] = {
            id: Xrm.Page.data.entity.getId(),
            type: 'EntityReference',
            logicalName: 'opportunity'
        }
        createRecord.attributes["transactioncurrencyid"] = {
            id: Xrm.Page.getAttribute("transactioncurrencyid").getValue()[0].id,
            type: 'EntityReference',
            logicalName: 'transactioncurrency'
        }

        let process = null;
        if (Form == 1) {
            if (Xrm.Page.getAttribute("dubois_equipmentpricelist").getValue() != null) {
                createRecord.attributes["pricelevelid"] = {
                    id: Xrm.Page.getAttribute("dubois_equipmentpricelist").getValue()[0].id,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
                createRecord.attributes["dubois_priceexceptionpricelist"] = {
                    id: Xrm.Page.getAttribute("dubois_equipmentpricelist").getValue()[0].id,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
            }
            process = GetProcessId(EquepmentBPF, EquepmentStageName);
            createRecord.attributes["dubois_createorder"] = true;
        }
        else if (Form == 2) {
            if (Xrm.Page.getAttribute("dubois_chemicalpricelist").getValue() != null) {
                createRecord.attributes["pricelevelid"] = {
                    id: Xrm.Page.getAttribute("dubois_chemicalpricelist").getValue()[0].id,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
                createRecord.attributes["dubois_priceexceptionpricelist"] = {
                    id: Xrm.Page.getAttribute("dubois_chemicalpricelist").getValue()[0].id,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
            }
            process = GetProcessId(ChemicalBPF, ChemicalStageName);
        }
        createRecord.attributes["dubois_pricelisttype"] = Xrm.Page.getAttribute("dubois_pricelisttype").getValue();
        createRecord.attributes["processid"] = {
            value: process.processId,
            type: 'guid'
        }
        createRecord.attributes["stageid"] = {
            value: process.stageId,
            type: 'guid'
        }

        try {
            let QuoteId = XrmServiceToolkit.Soap.Create(createRecord);
            var windowOptions = { openInNewWindow: true };
            Xrm.Utility.openEntityForm("quote", QuoteId, null, windowOptions);
            Xrm.Page.ui.controls.get(GridName).refresh();
        } catch (e) {
            Xrm.Navigation.openAlertDialog({ text: e.message }, { height: 120, width: 260 }).then(function () { });
        }
    }

    function CreateQuotefromAccount(Form, GridName) {
        var createRecord = new XrmServiceToolkit.Soap.BusinessEntity("quote");
        createRecord.attributes["customerid"] = {
            id: Xrm.Page.data.entity.getId(),
            type: 'EntityReference',
            logicalName: 'account'
        }
        createRecord.attributes["dubois_customeraccountnumber"] = Xrm.Page.getAttribute("dubois_axcustomerid").getValue() != null ? Xrm.Page.getAttribute("dubois_axcustomerid").getValue() : null;
        createRecord.attributes["dubois_estimatedcurrentyeartotalsales"] = {
            value: (Xrm.Page.getAttribute("dubois_ytdrevenue").getValue() != null ? Xrm.Page.getAttribute("dubois_ytdrevenue").getValue() : 0),
            type: 'Money'
        }
        createRecord.attributes["dubois_prioryeartotalsales"] = {
            value: (Xrm.Page.getAttribute("dubois_trailing12").getValue() != null ? Xrm.Page.getAttribute("dubois_trailing12").getValue() : 0),
            type: 'Money'
        }
        createRecord.attributes["dubois_mtdrevenue"] = {
            value: (Xrm.Page.getAttribute("dubois_mtdrevenue").getValue() != null ? Xrm.Page.getAttribute("dubois_mtdrevenue").getValue() : 0),
            type: 'Money'
        }
        createRecord.attributes["dubois_openorder"] = {
            value: (Xrm.Page.getAttribute("dubois_openorder").getValue() != null ? Xrm.Page.getAttribute("dubois_openorder").getValue() : 0),
            type: 'Money'
        }
        createRecord.attributes["dubois_lysamemonthrevenue"] = {
            value: (Xrm.Page.getAttribute("dubois_lysamemonthrevenue").getValue() != null ? Xrm.Page.getAttribute("dubois_lysamemonthrevenue").getValue() : 0),
            type: 'Money'
        }
        createRecord.attributes["dubois_lytdrevenue"] = {
            value: (Xrm.Page.getAttribute("dubois_lytdrevenue").getValue() != null ? Xrm.Page.getAttribute("dubois_lytdrevenue").getValue() : 0),
            type: 'Money'
        }
        createRecord.attributes["dubois_corporatecustomer"] = (Xrm.Page.getAttribute("dubois_corporatecustomer").getValue() != null ? Xrm.Page.getAttribute("dubois_corporatecustomer").getValue() : false);
        //if (Xrm.Page.getAttribute("dubois_custompricelist").getValue() != null) {
        //    createRecord.attributes["pricelevelid"] = {
        //        id: Xrm.Page.getAttribute("dubois_custompricelist").getValue()[0].id,
        //        type: 'EntityReference',
        //        logicalName: 'pricelevel'
        //    }
        //}
        createRecord.attributes["name"] = Xrm.Page.getAttribute("name").getValue();
        createRecord.attributes["dubois_requesttype"] = {
            value: Form,
            type: 'OptionSetValue'
        }
        let process = null;
        if (Xrm.Page.getAttribute("transactioncurrencyid") != null && Xrm.Page.getAttribute("transactioncurrencyid").getValue() != null) {
            createRecord.attributes["transactioncurrencyid"] = {
                id: Xrm.Page.getAttribute("transactioncurrencyid").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'transactioncurrency'
            }
        }
        if (Form == 1) {
            let obj = GetPriceListfromAccount(Xrm.Page.data.entity.getId());
            createRecord.attributes["dubois_pricelisttype"] = obj.PriceListType;
            createRecord.attributes["dubois_createorder"] = true;
            createRecord.attributes["dubois_shipto"] = { value: 2, type: 'OptionSetValue' };;
            createRecord.attributes["dubois_equipmentpaymenttype"] = { value: 1, type: 'OptionSetValue' };
            if (obj.EquipmentId != null) {
                let Column = ["transactioncurrencyid"];
                let retrievedResult = XrmServiceToolkit.Soap.Retrieve("pricelevel", obj.EquipmentId, Column);
                if (retrievedResult.attributes["transactioncurrencyid"] != null) {
                    createRecord.attributes["transactioncurrencyid"] = {
                        id: retrievedResult.attributes["transactioncurrencyid"].id,
                        type: 'EntityReference',
                        logicalName: 'transactioncurrency'
                    }
                }
                createRecord.attributes["pricelevelid"] = {
                    id: obj.EquipmentId,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
                createRecord.attributes["dubois_priceexceptionpricelist"] = {
                    id: obj.EquipmentId,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
            }
            process = GetProcessId(EquepmentBPF, EquepmentStageName);
        }
        else if (Form == 2) {
            let obj = GetPriceListfromAccount(Xrm.Page.data.entity.getId());
            createRecord.attributes["dubois_pricelisttype"] = obj.PriceListType;
            if (obj.ChemicalId != null) {
                let Column = ["transactioncurrencyid"];
                let retrievedResult = XrmServiceToolkit.Soap.Retrieve("pricelevel", obj.ChemicalId, Column);
                if (retrievedResult.attributes["transactioncurrencyid"] != null) {
                    createRecord.attributes["transactioncurrencyid"] = {
                        id: retrievedResult.attributes["transactioncurrencyid"].id,
                        type: 'EntityReference',
                        logicalName: 'transactioncurrency'
                    }
                }
                createRecord.attributes["pricelevelid"] = {
                    id: obj.ChemicalId,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
                createRecord.attributes["dubois_priceexceptionpricelist"] = {
                    id: obj.ChemicalId,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
            }
            process = GetProcessId(ChemicalBPF, ChemicalStageName);
        }

        createRecord.attributes["processid"] = {
            value: process.processId,
            type: 'guid'
        }
        createRecord.attributes["stageid"] = {
            value: process.stageId,
            type: 'guid'
        }

        if (Xrm.Page.getAttribute("dubois_salesrep").getValue() != null) {
            createRecord.attributes["dubois_salesrepresentative"] = {
                id: Xrm.Page.getAttribute("dubois_salesrep").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'systemuser'
            }

            let UserId = Xrm.Page.getAttribute("dubois_salesrep").getValue()[0].id;
            let Column = ["parentsystemuserid", "dubois_rvp"];
            let retrievedResult = XrmServiceToolkit.Soap.Retrieve("systemuser", UserId, Column);
            if (retrievedResult.attributes["parentsystemuserid"] != null) {
                createRecord.attributes["dubois_manager"] = {
                    id: retrievedResult.attributes["parentsystemuserid"].id,
                    type: 'EntityReference',
                    logicalName: 'systemuser'
                }
            }
            if (retrievedResult.attributes["dubois_rvp"] != null) {
                createRecord.attributes["dubois_rvpapprover"] = {
                    id: retrievedResult.attributes["dubois_rvp"].id,
                    type: 'EntityReference',
                    logicalName: 'systemuser'
                }
            }
        }
        if (Xrm.Page.getAttribute("dubois_techrep").getValue() != null) {
            createRecord.attributes["dubois_servicetechnician"] = {
                id: Xrm.Page.getAttribute("dubois_techrep").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'systemuser'
            }
        }
        if (Xrm.Page.getAttribute("dubois_sae").getValue() != null) {
            createRecord.attributes["dubois_technicalspecialist"] = {
                id: Xrm.Page.getAttribute("dubois_sae").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'systemuser'
            }
        }
        if (Xrm.Page.getAttribute("dubois_rd").getValue() != null) {
            createRecord.attributes["dubois_rdcontact"] = {
                id: Xrm.Page.getAttribute("dubois_rd").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'systemuser'
            }
        }
        if (Xrm.Page.getAttribute("dubois_additionalrepresentative").getValue() != null) {
            createRecord.attributes["dubois_additionalrep"] = {
                id: Xrm.Page.getAttribute("dubois_additionalrepresentative").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'systemuser'
            }
        }
        if (Xrm.Page.getAttribute("dubois_techadviser").getValue() != null) {
            createRecord.attributes["dubois_techadviser"] = {
                id: Xrm.Page.getAttribute("dubois_techadviser").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'systemuser'
            }
        }
        if (Xrm.Page.getAttribute("dubois_newaddresslookup").getValue() != null) {
            createRecord.attributes["dubois_primaryaddresss"] = {
                id: Xrm.Page.getAttribute("dubois_newaddresslookup").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'dubois_address'
            }
        }
        try {
            let QuoteId = XrmServiceToolkit.Soap.Create(createRecord);
            var windowOptions = { openInNewWindow: true, fullscreen: true };
            Xrm.Utility.openEntityForm("quote", QuoteId, null, windowOptions);
            Xrm.Page.ui.controls.get(GridName).refresh();
        } catch (e) {
            Xrm.Navigation.openAlertDialog({ text: e.message }, { height: 120, width: 260 }).then(function () { });
        }
    }

    function CreateQuotefromContact(Form, GridName) {
        var createRecord = new XrmServiceToolkit.Soap.BusinessEntity("quote");
        let accountId = null;
        if (Xrm.Page.getAttribute("parentcustomerid") != null && Xrm.Page.getAttribute("parentcustomerid").getValue() != null) {
            accountId = Xrm.Page.getAttribute("parentcustomerid").getValue()[0].id;
            createRecord.attributes["customerid"] = {
                id: Xrm.Page.getAttribute("parentcustomerid").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'account'
            }
            let obj = getAccountData(Xrm.Page.getAttribute("parentcustomerid").getValue()[0].id);
            createRecord.attributes["dubois_estimatedcurrentyeartotalsales"] = {
                value: obj.YTD,
                type: 'Money'
            }
            createRecord.attributes["dubois_prioryeartotalsales"] = {
                value: obj.Trailing,
                type: 'Money'
            }
            createRecord.attributes["dubois_corporatecustomer"] = obj.CorporateCust;

            createRecord.attributes["dubois_mtdrevenue"] = {
                value: obj.MTD,
                type: 'Money'
            }
            createRecord.attributes["dubois_openorder"] = {
                value: obj.OpenOrder,
                type: 'Money'
            }
            createRecord.attributes["dubois_lysamemonthrevenue"] = {
                value: obj.LYPerMonth,
                type: 'Money'
            }
            createRecord.attributes["dubois_lytdrevenue"] = {
                value: obj.LYTD,
                type: 'Money'
            }

            createRecord.attributes["dubois_servicetechnician"] = obj.TechRep;
            createRecord.attributes["dubois_technicalspecialist"] = obj.SAE;
            createRecord.attributes["dubois_rdcontact"] = obj.RND;
            createRecord.attributes["dubois_additionalrep"] = obj.AdditionRep;
            createRecord.attributes["dubois_salesrepresentative"] = obj.SalesRep;
            createRecord.attributes["dubois_manager"] = obj.Manager;
            createRecord.attributes["dubois_rvpapprover"] = obj.rvp;
            createRecord.attributes["dubois_techadviser"] = obj.TechAdviser;
            createRecord.attributes["dubois_customeraccountnumber"] = obj.AXCustomerId;
            createRecord.attributes["dubois_primaryaddresss"] = obj.PrimaryAddress;

            //if (obj.Pricelist != null) {
            //    createRecord.attributes["pricelevelid"] = {
            //        id: obj.Pricelist,
            //        type: 'EntityReference',
            //        logicalName: 'pricelevel'
            //    }
            //}
        }
        //if (Xrm.Page.getAttribute("parentcontactid").getValue() != null) {
        //    createRecord.attributes["dubois_contact"] = {
        //        id: Xrm.Page.getAttribute("parentcontactid").getValue()[0].id,
        //        type: 'EntityReference',
        //        logicalName: 'contact'
        //    }
        //}
        createRecord.attributes["name"] = Xrm.Page.getAttribute("firstname").getValue() + " " + Xrm.Page.getAttribute("lastname").getValue();
        createRecord.attributes["dubois_requesttype"] = {
            value: Form,
            type: 'OptionSetValue'
        }
        createRecord.attributes["dubois_contact"] = {
            id: Xrm.Page.data.entity.getId(),
            type: 'EntityReference',
            logicalName: 'contact'
        }
        //if (createRecord.attributes.pricelevelid == null && Xrm.Page.getAttribute("pricelevelid").getValue() != null) {
        //    createRecord.attributes["pricelevelid"] = {
        //        id: Xrm.Page.getAttribute("pricelevelid").getValue()[0].id,
        //        type: 'EntityReference',
        //        logicalName: 'pricelevel'
        //    }
        //}
        if (Xrm.Page.getAttribute("transactioncurrencyid") != null && Xrm.Page.getAttribute("transactioncurrencyid").getValue() != null) {
            createRecord.attributes["transactioncurrencyid"] = {
                id: Xrm.Page.getAttribute("transactioncurrencyid").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'transactioncurrency'
            }
        }


        let process = null;
        if (Form == 1) {
            let obj = GetPriceListfromAccount(accountId);
            createRecord.attributes["dubois_pricelisttype"] = obj.PriceListType;
            createRecord.attributes["dubois_createorder"] = true;
            if (obj.EquipmentId != null) {
                let Column = ["transactioncurrencyid"];
                let retrievedResult = XrmServiceToolkit.Soap.Retrieve("pricelevel", obj.EquipmentId, Column);
                if (retrievedResult.attributes["transactioncurrencyid"] != null) {
                    createRecord.attributes["transactioncurrencyid"] = {
                        id: retrievedResult.attributes["transactioncurrencyid"].id,
                        type: 'EntityReference',
                        logicalName: 'transactioncurrency'
                    }
                }
                createRecord.attributes["pricelevelid"] = {
                    id: obj.EquipmentId,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
                createRecord.attributes["dubois_priceexceptionpricelist"] = {
                    id: obj.EquipmentId,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
            }
            process = GetProcessId(EquepmentBPF, EquepmentStageName);
        }
        else if (Form == 2) {
            let obj = GetPriceListfromAccount(accountId);
            createRecord.attributes["dubois_pricelisttype"] = obj.PriceListType;
            if (obj.ChemicalId != null) {
                let Column = ["transactioncurrencyid"];
                let retrievedResult = XrmServiceToolkit.Soap.Retrieve("pricelevel", obj.ChemicalId, Column);
                if (retrievedResult.attributes["transactioncurrencyid"] != null) {
                    createRecord.attributes["transactioncurrencyid"] = {
                        id: retrievedResult.attributes["transactioncurrencyid"].id,
                        type: 'EntityReference',
                        logicalName: 'transactioncurrency'
                    }
                }
                createRecord.attributes["pricelevelid"] = {
                    id: obj.ChemicalId,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
                createRecord.attributes["dubois_priceexceptionpricelist"] = {
                    id: obj.ChemicalId,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
            }
            process = GetProcessId(ChemicalBPF, ChemicalStageName);
        }
        createRecord.attributes["processid"] = {
            value: process.processId,
            type: 'guid'
        }
        createRecord.attributes["stageid"] = {
            value: process.stageId,
            type: 'guid'
        }

        try {
            let QuoteId = XrmServiceToolkit.Soap.Create(createRecord);
            var windowOptions = { openInNewWindow: true };
            Xrm.Utility.openEntityForm("quote", QuoteId, null, windowOptions);
            Xrm.Page.ui.controls.get(GridName).refresh();
        } catch (e) {
            Xrm.Navigation.openAlertDialog({ text: e.message }, { height: 120, width: 260 }).then(function () { });
        }
    }

    function CreateQuotefromCase(Form, GridName) {
        var createRecord = new XrmServiceToolkit.Soap.BusinessEntity("quote");
        let accountId = null;
        if (Xrm.Page.getAttribute("customerid") != null && Xrm.Page.getAttribute("customerid").getValue() != null) {
            accountId = Xrm.Page.getAttribute("customerid").getValue()[0].id;
            createRecord.attributes["customerid"] = {
                id: Xrm.Page.getAttribute("customerid").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'account'
            }
            let obj = getAccountData(Xrm.Page.getAttribute("customerid").getValue()[0].id);
            createRecord.attributes["dubois_estimatedcurrentyeartotalsales"] = {
                value: obj.YTD,
                type: 'Money'
            }
            createRecord.attributes["dubois_prioryeartotalsales"] = {
                value: obj.Trailing,
                type: 'Money'
            }
            createRecord.attributes["dubois_corporatecustomer"] = obj.CorporateCust;

            createRecord.attributes["dubois_mtdrevenue"] = {
                value: obj.MTD,
                type: 'Money'
            }
            createRecord.attributes["dubois_openorder"] = {
                value: obj.OpenOrder,
                type: 'Money'
            }
            createRecord.attributes["dubois_lysamemonthrevenue"] = {
                value: obj.LYPerMonth,
                type: 'Money'
            }
            createRecord.attributes["dubois_lytdrevenue"] = {
                value: obj.LYTD,
                type: 'Money'
            }

            createRecord.attributes["dubois_servicetechnician"] = obj.TechRep;
            createRecord.attributes["dubois_technicalspecialist"] = obj.SAE;
            createRecord.attributes["dubois_rdcontact"] = obj.RND;
            createRecord.attributes["dubois_additionalrep"] = obj.AdditionRep;
            createRecord.attributes["dubois_salesrepresentative"] = obj.SalesRep;
            createRecord.attributes["dubois_manager"] = obj.Manager;
            createRecord.attributes["dubois_techadviser"] = obj.TechAdviser;
            createRecord.attributes["dubois_customeraccountnumber"] = obj.AXCustomerId;
            createRecord.attributes["dubois_primaryaddresss"] = obj.PrimaryAddress;

            //if (obj.Pricelist != null) {
            //    createRecord.attributes["pricelevelid"] = {
            //        id: obj.Pricelist,
            //        type: 'EntityReference',
            //        logicalName: 'pricelevel'
            //    }
            //}
        }
        if (Xrm.Page.getAttribute("responsiblecontactid").getValue() != null) {
            createRecord.attributes["dubois_contact"] = {
                id: Xrm.Page.getAttribute("responsiblecontactid").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'contact'
            }
        }
        createRecord.attributes["name"] = Xrm.Page.getAttribute("title").getValue();
        createRecord.attributes["dubois_requesttype"] = {
            value: Form,
            type: 'OptionSetValue'
        }
        createRecord.attributes["dubois_case"] = {
            id: Xrm.Page.data.entity.getId(),
            type: 'EntityReference',
            logicalName: 'incident'
        }
        //if (createRecord.attributes.pricelevelid == null && Xrm.Page.getAttribute("pricelevelid").getValue() != null) {
        //    createRecord.attributes["pricelevelid"] = {
        //        id: Xrm.Page.getAttribute("pricelevelid").getValue()[0].id,
        //        type: 'EntityReference',
        //        logicalName: 'pricelevel'
        //    }
        //}
        if (Xrm.Page.getAttribute("transactioncurrencyid") != null && Xrm.Page.getAttribute("transactioncurrencyid").getValue() != null) {
            createRecord.attributes["transactioncurrencyid"] = {
                id: Xrm.Page.getAttribute("transactioncurrencyid").getValue()[0].id,
                type: 'EntityReference',
                logicalName: 'transactioncurrency'
            }
        }


        let process = null;
        if (Form == 1) {
            let obj = GetPriceListfromAccount(accountId);
            createRecord.attributes["dubois_pricelisttype"] = obj.PriceListType;
            createRecord.attributes["dubois_createorder"] = true;
            if (obj.EquipmentId != null) {
                let Column = ["transactioncurrencyid"];
                let retrievedResult = XrmServiceToolkit.Soap.Retrieve("pricelevel", obj.EquipmentId, Column);
                if (retrievedResult.attributes["transactioncurrencyid"] != null) {
                    createRecord.attributes["transactioncurrencyid"] = {
                        id: retrievedResult.attributes["transactioncurrencyid"].id,
                        type: 'EntityReference',
                        logicalName: 'transactioncurrency'
                    }
                }
                createRecord.attributes["pricelevelid"] = {
                    id: obj.EquipmentId,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
                createRecord.attributes["dubois_priceexceptionpricelist"] = {
                    id: obj.EquipmentId,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
            }
            process = GetProcessId(EquepmentBPF, EquepmentStageName);
        }
        else if (Form == 2) {
            let obj = GetPriceListfromAccount(accountId);
            createRecord.attributes["dubois_pricelisttype"] = obj.PriceListType;
            if (obj.ChemicalId != null) {
                let Column = ["transactioncurrencyid"];
                let retrievedResult = XrmServiceToolkit.Soap.Retrieve("pricelevel", obj.ChemicalId, Column);
                if (retrievedResult.attributes["transactioncurrencyid"] != null) {
                    createRecord.attributes["transactioncurrencyid"] = {
                        id: retrievedResult.attributes["transactioncurrencyid"].id,
                        type: 'EntityReference',
                        logicalName: 'transactioncurrency'
                    }
                }
                createRecord.attributes["pricelevelid"] = {
                    id: obj.ChemicalId,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
                createRecord.attributes["dubois_priceexceptionpricelist"] = {
                    id: obj.ChemicalId,
                    type: 'EntityReference',
                    logicalName: 'pricelevel'
                }
            }
            process = GetProcessId(ChemicalBPF, ChemicalStageName);
        }
        createRecord.attributes["processid"] = {
            value: process.processId,
            type: 'guid'
        }
        createRecord.attributes["stageid"] = {
            value: process.stageId,
            type: 'guid'
        }

        try {
            let QuoteId = XrmServiceToolkit.Soap.Create(createRecord);
            //var windowOptions = { openInNewWindow: true };
            //Xrm.Utility.openEntityForm("quote", QuoteId, null, windowOptions);

            var entityFormOptions = {};
            entityFormOptions["entityName"] = "quote";
            entityFormOptions["entityId"] = QuoteId;
            entityFormOptions["openInNewWindow"] = true;
            // Open the form.
            Xrm.Navigation.openForm(entityFormOptions).then(
                function (success) {
                },
                function (error) {
                    Xrm.Navigation.openAlertDialog({ text: error.message }, { height: 120, width: 260 }).then(function () { });
                });
            formContext.ui.controls.get(GridName).refresh();
        } catch (e) {
            Xrm.Navigation.openAlertDialog({ text: e.message }, { height: 120, width: 260 }).then(function () { });
        }
    }

    function GetProcessId(processName, stageName) {
        let obj = {};
        obj.processId = "";
        obj.stageId = "";
        let XML = "";
        XML += "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>";
        XML += "<entity name='workflow'>";
        XML += "<attribute name='workflowid' />";
        XML += "<filter type='and'>";
        XML += "<condition attribute='category' operator='eq' value='4' />";
        XML += "<condition attribute='name' operator='eq' value='" + processName + "' />";
        XML += "</filter>";
        XML += "<link-entity name='processstage' from='processid' to='workflowid' link-type='inner' alias='Process'>";
        XML += "<attribute name='processstageid' />";
        XML += "<filter type='and'>";
        XML += "<condition attribute='stagename' operator='eq' value='" + stageName + "' />";
        XML += "</filter>";
        XML += "</link-entity>";
        XML += "</entity>";
        XML += "</fetch>";

        let process = XrmServiceToolkit.Soap.Fetch(XML);
        if (process.length > 0) {
            obj.processId = "";
            obj.stageId = "";
            if (process[0].attributes["workflowid"] != null)
                obj.processId = process[0].attributes["workflowid"].value;
            if (process[0].attributes["Process.processstageid"] != null)
                obj.stageId = process[0].attributes["Process.processstageid"].value;
        }
        return obj;
    }

    var GetReportingManager = function (UserId) {
        let Column = ["parentsystemuserid"];
        let retrievedResult = XrmServiceToolkit.Soap.Retrieve("systemuser", UserId, Column);
        let SId = null;
        if (retrievedResult.attributes["parentsystemuserid"] != null)
            SId = retrievedResult.attributes["parentsystemuserid"].id;
        return SId;
    };

    var getAccountData = function (AccountId) {
        let obj = {};
        obj.YTD = 0;
        obj.OpenOrder = 0;
        obj.MTD = 0;
        obj.LYPerMonth = 0;
        obj.LYTD = 0;
        obj.Trailing = 0;
        obj.CorporateCust = false;
        obj.Pricelist = null;
        obj.TechRep = null;
        obj.SAE = null;
        obj.rvp = null;
        obj.RND = null;
        obj.AdditionRep = null;
        obj.SalesRep = null;
        obj.Manager = null;
        obj.TechAdviser = null;
        obj.AXCustomerId = null;
        obj.Currency = null;
        obj.PrimaryAddress = null;
        let Column = ["dubois_ytdrevenue", "dubois_trailing12", "dubois_corporatecustomer", "dubois_custompricelist",
            "dubois_mtdrevenue", "dubois_openorder", "dubois_lysamemonthrevenue", "dubois_lytdrevenue",
            "dubois_salesrep", "dubois_manager", "dubois_techrep", "dubois_sae", "dubois_rd", "dubois_additionalrepresentative", "dubois_techadviser",
            "dubois_axcustomerid", "dubois_newaddresslookup", "dubois_rvp"];
        let retrievedResult = XrmServiceToolkit.Soap.Retrieve("account", AccountId, Column);

        if (retrievedResult.attributes["dubois_ytdrevenue"] != null)
            obj.YTD = retrievedResult.attributes["dubois_ytdrevenue"].value;
        if (retrievedResult.attributes["dubois_trailing12"] != null)
            obj.Trailing = retrievedResult.attributes["dubois_trailing12"].value;
        if (retrievedResult.attributes["dubois_corporatecustomer"] != null)
            obj.CorporateCust = retrievedResult.attributes["dubois_corporatecustomer"].value;
        if (retrievedResult.attributes["dubois_custompricelist"] != null)
            obj.Pricelist = retrievedResult.attributes["dubois_custompricelist"].id;

        if (retrievedResult.attributes["dubois_mtdrevenue"] != null)
            obj.MTD = retrievedResult.attributes["dubois_mtdrevenue"].value;
        if (retrievedResult.attributes["dubois_openorder"] != null)
            obj.OpenOrder = retrievedResult.attributes["dubois_openorder"].value;
        if (retrievedResult.attributes["dubois_lysamemonthrevenue"] != null)
            obj.LYPerMonth = retrievedResult.attributes["dubois_lysamemonthrevenue"].value;
        if (retrievedResult.attributes["dubois_lytdrevenue"] != null)
            obj.LYTD = retrievedResult.attributes["dubois_lytdrevenue"].value;


        if (retrievedResult.attributes["dubois_techrep"] != null)
            obj.TechRep = { id: retrievedResult.attributes["dubois_techrep"].id, type: 'EntityReference', logicalName: 'systemuser' };
        if (retrievedResult.attributes["dubois_sae"] != null)
            obj.SAE = { id: retrievedResult.attributes["dubois_sae"].id, type: 'EntityReference', logicalName: 'systemuser' };
        if (retrievedResult.attributes["dubois_rd"] != null)
            obj.RND = { id: retrievedResult.attributes["dubois_rd"].id, type: 'EntityReference', logicalName: 'systemuser' };
        if (retrievedResult.attributes["dubois_techadviser"] != null)
            obj.TechAdviser = { id: retrievedResult.attributes["dubois_techadviser"].id, type: 'EntityReference', logicalName: 'systemuser' };
        if (retrievedResult.attributes["dubois_additionalrepresentative"] != null)
            obj.AdditionRep = { id: retrievedResult.attributes["dubois_additionalrepresentative"].id, type: 'EntityReference', logicalName: 'systemuser' };
        if (retrievedResult.attributes["dubois_salesrep"] != null) {
            obj.SalesRep = { id: retrievedResult.attributes["dubois_salesrep"].id, type: 'EntityReference', logicalName: 'systemuser' };
            let Column = ["parentsystemuserid", "dubois_rvp"];
            let retrievedResult1 = XrmServiceToolkit.Soap.Retrieve("systemuser", retrievedResult.attributes["dubois_salesrep"].id, Column);
            if (retrievedResult1.attributes["parentsystemuserid"] != null) {
                obj.Manager = { id: retrievedResult1.attributes["parentsystemuserid"].id, type: 'EntityReference', logicalName: 'systemuser' };
            }
            if (retrievedResult1.attributes["dubois_rvp"] != null) {
                obj.rvp = { id: retrievedResult1.attributes["dubois_rvp"].id, type: 'EntityReference', logicalName: 'systemuser' };
            }
        }

        if (retrievedResult.attributes["transactioncurrencyid"] != null)
            obj.Currency = { id: retrievedResult.attributes["transactioncurrencyid"].id, type: 'EntityReference', logicalName: 'transactioncurrency' };

        if (retrievedResult.attributes["dubois_newaddresslookup"] != null)
            obj.PrimaryAddress = { id: retrievedResult.attributes["dubois_newaddresslookup"].id, type: 'EntityReference', logicalName: 'dubois_address' };

        if (retrievedResult.attributes["dubois_axcustomerid"] != null)
            obj.AXCustomerId = retrievedResult.attributes["dubois_axcustomerid"].value;

        return obj;
    }

    function ChangeBuyersRoleOnGridLoad() {
        let StakeholderCount = formContext.getAttribute("dubois_stakeholdergridcount").getValue();
        let OpportunityId = formContext.data.entity.getId();

        let fetchxml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
            "  <entity name='connection'>" +
            "    <attribute name='record2id' />" +
            "    <attribute name='record2roleid' />" +
            "    <attribute name='connectionid' />" +
            "    <order attribute='record2id' descending='false' />" +
            "    <link-entity name='opportunity' from='opportunityid' to='record1id' link-type='inner' alias='ad'>" +
            "      <filter type='and'>" +
            "        <condition attribute='opportunityid' operator='eq'  value='" + OpportunityId + "' />" +
            "      </filter>" +
            "    </link-entity>" +
            "  </entity>" +
            "</fetch>";

        let StakeholderData = XrmServiceToolkit.Soap.Fetch(fetchxml);

        if (StakeholderCount != StakeholderData.length) {
            formContext.getAttribute("dubois_stakeholdergridcount").setValue(StakeholderData.length.toString());
            if (StakeholderData.length > 0) {
                formContext.getAttribute("dubois_buyersroles").setValue(1);
            }
            else {
                formContext.getAttribute("dubois_buyersroles").setValue(0);
            }
            formContext.data.refresh(true);
            formContext.data.entity.save();
        }
    }
    function hasUserRoles(rolesToCheck) {
        let hasRole = false;
        let roles = Xrm.Utility.getGlobalContext().userSettings.roles;
        //let rolesToCheck = ["System Administrator", "Dubois_Marketing"];
        roles.forEach(x => {
            if (rolesToCheck.indexOf(x.name) > -1) {
                hasRole = true;
                return;
            }
        });
        return hasRole;
    }
    function OnChangeOfOpportunityType(executionContext) {             //OnChange of Opportunity type and Value type
        formContext = executionContext.getFormContext(); // get formContext
        if (formContext.getAttribute("dubois_opportunitytype") != null && formContext.getAttribute("dubois_opportunitytype").getValue() != null) {
            let OpportunityType = formContext.getAttribute("dubois_opportunitytype").getValue();
            if (OpportunityType == 1) {
                //var UserRole = XrmServiceToolkit.Soap.IsCurrentUserRole("System Administrator");
                var UserRole = hasUserRoles(["System Administrator"]);
                if (UserRole == true) {
                    formContext.ui.controls.get("dubois_opportunitytype").setDisabled(false);
                }
                else {
                    formContext.ui.controls.get("dubois_opportunitytype").setDisabled(true);
                }
                var tab = formContext.ui.tabs.get("Sales Potential");
                tab.sections.get("Summary_section_5").setVisible(false);
                let TopOpportunity = formContext.getAttribute("dubois_topopportunity").getValue();
                if (TopOpportunity != false) {
                    formContext.getAttribute("dubois_topopportunity").setValue(false);
                }
                formContext.getControl("dubois_topopportunity").setVisible(false);
                //formContext.getControl("header_dubois_winforecast").setVisible(false);
                //Xrm.Page.getControl("header_process_dubois_winprobability").setVisible(false);
                if (formContext.getControl("header_process_dubois_proposalwinprobability") != null) {
                    formContext.getControl("header_process_dubois_proposalwinprobability").setVisible(false);
                }
                if (formContext.getControl("header_process_dubois_trialwinprobability") != null) {
                    formContext.getControl("header_process_dubois_trialwinprobability").setVisible(false);
                }
                if (formContext.getControl("header_process_dubois_closingwinprobability") != null) {
                    formContext.getControl("header_process_dubois_closingwinprobability").setVisible(false);
                }
            }
            else {
                var tab = formContext.ui.tabs.get("Sales Potential");
                tab.sections.get("Summary_section_5").setVisible(true);
                formContext.getControl("dubois_topopportunity").setVisible(true);
                //formContext.getControl("header_dubois_winforecast").setVisible(true);
                //Xrm.Page.getControl("header_process_dubois_winprobability").setVisible(true);
                if (formContext.getControl("header_process_dubois_proposalwinprobability") != null) {
                    formContext.getControl("header_process_dubois_proposalwinprobability").setVisible(true);
                }
                if (formContext.getControl("header_process_dubois_trialwinprobability") != null) {
                    formContext.getControl("header_process_dubois_trialwinprobability").setVisible(true);
                }
                if (formContext.getControl("header_process_dubois_closingwinprobability") != null) {
                    formContext.getControl("header_process_dubois_closingwinprobability").setVisible(true);
                }

                if (formContext.getAttribute("dubois_valuetype").getValue() == 1
                    || formContext.getAttribute("dubois_valuetype").getValue() == 4
                    || formContext.getAttribute("dubois_valuetype").getValue() == 5
                ) {
                    formContext.ui.controls.get("dubois_lossprobability").setVisible(false);
                    formContext.ui.controls.get("dubois_lossforecast").setVisible(false);
                }
                else {
                    formContext.ui.controls.get("dubois_lossprobability").setVisible(true);
                    formContext.ui.controls.get("dubois_lossforecast").setVisible(true);
                }
            }
        }
    }

    function SetActualCloseDatefieldValuetoCloseDate(executionContext) {                             //OnChangeofActualCloseDate
        formContext = executionContext.getFormContext(); // get formContext
        if (formContext.getAttribute("actualclosedate") != null && formContext.getAttribute("actualclosedate").getValue() != null) {
            ActualCloseDate = formContext.getAttribute("actualclosedate").getValue();
            formContext.getAttribute("dubois_closedatecontainsactualclosedate").setValue(ActualCloseDate);
            formContext.data.entity.save();
        }
    }

    function CalculateWinForecastOnAutoCalcRevenueYes() {
        //if (Xrm.Page.getAttribute("header_process_dubois_autocalculaterevenue") != null && Xrm.Page.getAttribute("header_process_dubois_autocalculaterevenue").getValue() == true) {
        //    var EstRevenue = Xrm.Page.getAttribute("header_estimatedvalue") != null ? Xrm.Page.getAttribute("header_estimatedvalue").getValue() : null;
        //    alert("Est.Revenue: " + Xrm.Page.getAttribute("header_estimatedvalue").getValue())
        //    var WinProbability = Xrm.Page.getAttribute("dubois_proposalwinprobability") != null ? Xrm.Page.getAttribute("dubois_proposalwinprobability").getValue() : null;
        //    var WinForeCast = null;
        //    if (EstRevenue != null && WinProbability != null) {
        //        WinForeCast = ((EstRevenue * WinProbability) / 100);
        //        if (WinForeCast != null) {
        //            if (Xrm.Page.getAttribute("dubois_winforecast") != null) {
        //                Xrm.Page.getAttribute("dubois_winforecast").setValue(WinForeCast);
        //            }
        //        }
        //    }
        //}
    }

    function OnChangeofSalesPerson(executionContext) {
        formContext = executionContext.getFormContext(); // get formContext
        if (formContext.getAttribute("dubois_salesrep") != null && formContext.getAttribute("dubois_salesrep").getValue() != null) {
            let UserId = formContext.getAttribute("dubois_salesrep").getValue()[0].id;
            Xrm.WebApi.retrieveRecord("systemuser", UserId, "?$select=_parentsystemuserid_value,_dubois_rvp_value").then(
                function success(result) {
                    var parentSystemUserId = result["_parentsystemuserid_value"]; // Lookup
                    var parentSystemUserName = result["_parentsystemuserid_value@OData.Community.Display.V1.FormattedValue"];
                    var rvpId = result["_dubois_rvp_value"]; // Lookup
                    var rvpName = result["_dubois_rvp_value@OData.Community.Display.V1.FormattedValue"];

                    if (parentSystemUserId != null) {
                        formContext.getAttribute("dubois_manager").setValue([{ id: parentSystemUserId, name: parentSystemUserName, entityType: "systemuser" }]);
                    }
                    if (rvpId != null) {
                        formContext.getAttribute("dubois_rvp").setValue([{ id: rvpId, name: rvpName, entityType: "systemuser" }]);
                    }
                },
                function (error) {
                    Xrm.Navigation.openAlertDialog({ text: error.message }, { height: 120, width: 260 }).then(function () { });
                }
            );
        }
    }

    function SetAssignmentSectionfieldsfromAccount(executionContext) {
        formContext = executionContext.getFormContext(); // get formContext
        if (formContext.getAttribute("parentaccountid") != null && formContext.getAttribute("parentaccountid").getValue() != null) {
            let Id = formContext.getAttribute("parentaccountid").getValue()[0].id;
            let LogicalName = formContext.getAttribute("parentaccountid").getValue()[0].entityType;

            if (LogicalName == "account") {
                GetParentAccountData(executionContext);
                formContext.getAttribute("dubois_manager").setValue(null);
                formContext.getAttribute("dubois_servicetechnician").setValue(null);
                formContext.getAttribute("dubois_technicalspecialist").setValue(null);
                formContext.getAttribute("dubois_rdcontact").setValue(null);
                formContext.getAttribute("dubois_additionalrep").setValue(null);
                Xrm.WebApi.retrieveRecord("account", Id, "?$select=_dubois_additionalrepresentative_value,_dubois_keyaccountrep_value,_dubois_manager_value,_dubois_rd_value,_dubois_rvp_value,_dubois_sae_value,_dubois_salesrep_value,_dubois_technicalspecialist2_value,_dubois_technicalspecialist3_value,_dubois_techrep_value").then(
                    function success(result) {
                        if (result["_dubois_techrep_value"] != null && formContext.getAttribute("dubois_servicetechnician") != null)
                            formContext.getAttribute("dubois_servicetechnician").setValue([{ id: result["_dubois_techrep_value"], name: result["_dubois_techrep_value@OData.Community.Display.V1.FormattedValue"], entityType: "systemuser" }]);
                        if (result["_dubois_sae_value"] != null && formContext.getAttribute("dubois_technicalspecialist") != null)
                            formContext.getAttribute("dubois_technicalspecialist").setValue([{ id: result["_dubois_sae_value"], name: result["_dubois_sae_value@OData.Community.Display.V1.FormattedValue"], entityType: "systemuser" }]);
                        if (result["_dubois_rd_value"] != null && formContext.getAttribute("dubois_rdcontact") != null)
                            formContext.getAttribute("dubois_rdcontact").setValue([{ id: result["_dubois_rd_value"], name: result["_dubois_rd_value@OData.Community.Display.V1.FormattedValue"], entityType: "systemuser" }]);
                        if (result["_dubois_additionalrepresentative_value"] != null && formContext.getAttribute("dubois_additionalrep") != null)
                            formContext.getAttribute("dubois_additionalrep").setValue([{ id: result["_dubois_additionalrepresentative_value"], name: result["_dubois_additionalrepresentative_value@OData.Community.Display.V1.FormattedValue"], entityType: "systemuser" }]);
                        if (result["_dubois_keyaccountrep_value"] != null && formContext.getAttribute("dubois_keyaccountrep") != null)
                            formContext.getAttribute("dubois_keyaccountrep").setValue([{ id: result["_dubois_keyaccountrep_value"], name: result["_dubois_keyaccountrep_value@OData.Community.Display.V1.FormattedValue"], entityType: "systemuser" }]);
                        if (result["_dubois_technicalspecialist2_value"] != null && formContext.getAttribute("dubois_technicalspecialist2") != null)
                            formContext.getAttribute("dubois_technicalspecialist2").setValue([{ id: result["_dubois_technicalspecialist2_value"], name: result["_dubois_technicalspecialist2_value@OData.Community.Display.V1.FormattedValue"], entityType: "systemuser" }]);
                        if (result["_dubois_technicalspecialist3_value"] != null && formContext.getAttribute("dubois_technicalspecialist3") != null)
                            formContext.getAttribute("dubois_technicalspecialist3").setValue([{ id: result["_dubois_technicalspecialist3_value"], name: result["_dubois_technicalspecialist3_value@OData.Community.Display.V1.FormattedValue"], entityType: "systemuser" }]);
                        if (result["_dubois_salesrep_value"] != null && formContext.getAttribute("dubois_salesrep") != null) {
                            formContext.getAttribute("dubois_salesrep").setValue([{ id: result["_dubois_salesrep_value"], name: result["_dubois_salesrep_value@OData.Community.Display.V1.FormattedValue"], entityType: "systemuser" }]);
                            OnChangeofSalesPerson(executionContext);
                        }
                        else {
                            formContext.getAttribute("dubois_manager").setValue(null);
                            formContext.getAttribute("dubois_rvp").setValue(null);
                        }
                    },
                    function (error) {
                        Xrm.Navigation.openAlertDialog({ text: error.message }, { height: 120, width: 260 }).then(function () { });
                    }
                );
                //Xrm.Page.getAttribute("dubois_manager").setValue([{ id: retrievedResult.attributes["dubois_manager"].id, name: retrievedResult.attributes["dubois_manager"].name, entityType: "systemuser" }]);
            }
        }
    }

    function OnChnageofEstCloseDate(executionContext) {
        formContext = executionContext.getFormContext(); // get formContext
        if (formContext.ui.getFormType() != 1) {
            var OpportunityId = formContext.data.entity.getId();
            Xrm.WebApi.retrieveRecord("opportunity", OpportunityId, "?$select=estimatedclosedate").then(
                function success(result) {
                    if (result["estimatedclosedate"] != null) {
                        if (formContext.getAttribute("estimatedclosedate").getIsDirty()) {
                            formContext.getControl("dubois_comments").setVisible(true);
                            formContext.getAttribute("dubois_comments").setRequiredLevel("required");
                        }
                        else {
                            formContext.getControl("dubois_comments").setVisible(false);
                            formContext.getAttribute("dubois_comments").setRequiredLevel("none");
                            formContext.getAttribute("dubois_comments").setValue("");
                        }
                    }
                },
                function (error) {
                    Xrm.Navigation.openAlertDialog({ text: error.message }, { height: 120, width: 260 }).then(function () { });
                }
            );

        }
    }

    //This function gets values of Specialty from Account and sets the same on opportunity
    function getSpecialtyFromAccount(executionContext) {
        formContext = executionContext.getFormContext(); // get formContext
        if (formContext.ui.getFormType() == 1) {
            var parentAccount = formContext.getAttribute("parentaccountid");
            if (parentAccount != undefined && parentAccount.getValue() != null) {
                Xrm.WebApi.online.retrieveRecord("account", parentAccount.getValue()[0].id, "?$select=dubois_segment").then(
                    function success(result) {
                        if (result["dubois_segment"] != null && result["dubois_segment"] != '') {
                            let ArrayData = JSON.parse('[' + result["dubois_segment"] + ']');
                            formContext.getAttribute("dubois_sectornew").setValue(ArrayData);
                        }
                    },
                    function (error) {
                        Xrm.Utility.alertDialog(error.message);
                    }
                );
            }

        }
    }
    //function PopulatefieldsforContactQuickCreate() {
    //    let parrentAccount = { entityType: "opportunity", id: Xrm.Page.getAttribute("parentaccountid").getValue()[0].id, };
    //    let parameters = { id: Xrm.Page.getAttribute("parentaccountid").getValue()[0].id, logicalName: Xrm.Page.getAttribute("parentaccountid").getValue()[0].entityType, type: 'EntityReference' };

    //    Xrm.Utility.openQuickCreate("contact", parrentAccount, parameters ).then(function (lookup) {
    //        successCallback(lookup);
    //    },
    //    function (error) {
    //        errorCallback(error);
    //    });
    //}

    function preFilterLookupOpportunityBasedonAccount(executionContext) {
        formContext = executionContext.getFormContext(); // get formContext
        formContext.getControl(parentOpportunity).addPreSearch(function () {
            addOppLookupFilter();

        });
    }
    function addOppLookupFilter() {
        var accountLookup = formContext.getAttribute(accountName).getValue();
        var lookupRecordGuid;
        if (accountLookup != null) {
            lookupRecordGuid = accountLookup[0].id;
        }
        if (lookupRecordGuid != null && lookupRecordGuid != 'undefined') {
            /*
            var XML = "";
            XML += "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>";
            XML += "<entity name='opportunity'>";
            XML += "<attribute name='name' />";
            XML += "<attribute name='opportunityid' />";
            XML += "<attribute name='parentaccountid' />";
            XML += "<filter type='and'>";
            XML += "<condition attribute='parentaccountid' operator='eq' uitype='account' value='" + lookupRecordGuid + "' />";
            XML += "</condition>";
            XML += "</filter>";
            XML += "</entity>";
            XML += "</fetch>";*/
            var Oppname = formContext.getAttribute("name").getValue();
            var fetchXML = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
                "<entity name='opportunity'>" +
                "<attribute name='opportunityid' />" +
                "<attribute name='name' />" +
                "<attribute name='parentaccountid' />" +
                "<filter type='and'>" +
                "<condition attribute='parentaccountid' operator='eq' uitype='account' value='" + lookupRecordGuid + "' />" +
                "<condition attribute='name' operator='ne' value='" + Oppname + "' />" +
                "</filter>" +
                "</entity>" +
                "</fetch>";
            // var oppNewData = XrmServiceToolkit.Soap.Fetch(fetchXML);
            // if (oppNewData.length > 0 && oppNewData[0].attributes["name"] != null) {

            formContext.getControl(parentOpportunity).addCustomFilter(fetchXML);
            //}
        }

    }
    function checkProductLinesCount(executionContext) {
        const formContext = executionContext.getFormContext();

        // Only run on Update forms
        if (formContext.ui.getFormType() !== 2) {
            return;
        }

        const subgrid = formContext.getControl("SubgridProductLines");
        if (!subgrid) {
            console.log("SubgridProductLines not found on the form.");
            return;
        }

        const gridRef = subgrid.getGrid();
        if (!gridRef) {
            console.log("Grid not yet available.");
            return;
        }

        var rowCount = gridRef.getTotalRecordCount();
        // Price Advisor owns quote line entry for the demo path; keep the legacy gate non-blocking.
        if (rowCount > 0)
            formContext.getAttribute("dubois_productlinesselected").setValue(true);
        if (typeof formContext.getAttribute("dubois_productlinesselected").setRequiredLevel === "function")
            formContext.getAttribute("dubois_productlinesselected").setRequiredLevel("none");
    }
    return {
        CallOnLoad: CallOnLoad,
        setAccountType: setAccountType,
        AddPreFilterOnAccountLookup: AddPreFilterOnAccountLookup,
        FilterContactgirdOnselectedAccount: FilterContactgirdOnselectedAccount,
        addPreFilterContactLookup: addPreFilterContactLookup,
        setParentAccountOnContactChange: setParentAccountOnContactChange,
        clearParentContactOnAccountChange: clearParentContactOnAccountChange,
        CalculateMonthlyValue: CalculateMonthlyValue,
        CalculateyearlyValue: CalculateyearlyValue,
        //CalculateLossProbability: CalculateLossProbability,
        //CalculateProbability: CalculateProbability,
        MonthlyCalculation: MonthlyCalculation,
        AnnualCalculation: AnnualCalculation,
        CallOnChangeofStage: CallOnChangeofStage,
        CallonAddQuote: CallonAddQuote,
        CallOnChangeofPERequired: CallOnChangeofPERequired,
        ChangeBuyersRoleOnGridLoad: ChangeBuyersRoleOnGridLoad,
        OnChangeOfOpportunityType: OnChangeOfOpportunityType,
        CallonSave: CallonSave,
        CallonAddOpportunityProduct: CallonAddOpportunityProduct,
        SetActualCloseDatefieldValuetoCloseDate: SetActualCloseDatefieldValuetoCloseDate,
        CalculateWinForecastOnAutoCalcRevenueYes: CalculateWinForecastOnAutoCalcRevenueYes,
        OnChangeofSalesPerson: OnChangeofSalesPerson,
        SetAssignmentSectionfieldsfromAccount: SetAssignmentSectionfieldsfromAccount,
        //OnChangeofCurrency: OnChangeofCurrency,
        OnChangeofChemicalPricelist: OnChangeofChemicalPricelist,
        OnChangeofEquipmentPriceList: OnChangeofEquipmentPriceList,
        OnChnageofEstCloseDate: OnChnageofEstCloseDate,
        preFilterLookupOpportunityBasedonAccount: preFilterLookupOpportunityBasedonAccount,
        getSpecialtyFromAccount: getSpecialtyFromAccount
    }
})();
