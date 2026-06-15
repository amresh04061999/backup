function setBPFByForm(executionContext) {
    var formContext = executionContext.getFormContext();

    // Get current form
    var currentForm = formContext.ui.formSelector.getCurrentItem();
    var formId = currentForm.getId();

    // Form IDs
    var formAId = "e02323e3-495f-f111-a826-6045bda74918"; // PA Opportunity Form ID
    var formBId = "d23694e6-52e2-ed11-a7c7-000d3a8fa28a"; // PE Opportunity Form ID

    // BPF IDs
    var bpfAId = "E9DC7E37-DC45-4DCB-BF89-F534C061AFB3"; // PA Opportunity Process BPF ID
    var bpfBId = "3772F48D-AB24-4597-AEDB-93D73340991E"; //PE Opportunity Process  BPF ID

    if (formId.toLowerCase() === formAId.toLowerCase()) {
        formContext.data.process.setActiveProcess(
            bpfAId,
            function (result) {
                console.log("BPF A activated: " + result);
            }
        );
    }
    else if (formId.toLowerCase() === formBId.toLowerCase()) {
        formContext.data.process.setActiveProcess(
            bpfBId,
            function (result) {
                console.log("BPF B activated: " + result);
            }
        );
    }
}