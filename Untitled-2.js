function setBPFByForm(executionContext) {
    var formContext = executionContext.getFormContext();

    // Get current form
    var currentForm = formContext.ui.formSelector.getCurrentItem();
    var formId = currentForm.getId();

    // Form IDs
    var formAId = "e02323e3-495f-f111-a826-6045bda74918"; // PA Opportunity Form ID
    var formBId = "d23694e6-52e2-ed11-a7c7-000d3a8fa28a"; // PE Opportunity Form ID

    // BPF IDs
    var bpfAId = "5B6BEFFF-1B86-4DAB-A0ED-B676BC16E2D8"; // PA Opportunity Process BPF ID
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