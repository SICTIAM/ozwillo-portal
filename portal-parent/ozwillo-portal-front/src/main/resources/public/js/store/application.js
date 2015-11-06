function setupAppPage() {


    $(".install-application * .btn-indicator").popover({
        content: $("div#install-app-popover").html(),
        html:true,
        placement:'bottom',
        trigger:'click'
    });

    if ($(".install-application * .btn-indicator").attr("data-open-popover") == "true") {
        $(".install-application * .btn-indicator:first").popover("show");
    }

    $(".install-application * .btn-indicator").on("shown.bs.popover", function() {
        $("a.orgselector").click(function(event) {
            event.preventDefault();

            var form = $("#buyform");
            var orgid = $(this).attr("data-orgid");
            form.find("#organizationId").attr("value", orgid);
            form.submit();
        });

        $("#ownbuy").click(function() {
            var form = $("#buyform");
            form.find("#organizationId").attr("value", null);
            form.submit();
        });
    });

    $("#forceInstall").click(function(event) {
        event.preventDefault();
        var form = $("#buyform");
        form.submit();
    });

    $("#create-org-application-id").val($("#create-org-button").data("appid"));
    $("#create-org-application-type").val($("#create-org-button").data("apptype"));

    $("#organization-name").change(function(e) {
        var valid = false;
        if ($(this).val().length > 0) {
            valid = true;
        }

        if (valid) {
            $("#create-org-submit").removeAttr("disabled");
        } else {
            $("#create-org-submit").attr("disabled", "disabled");
        }
    });

    $("#create-org-submit").click(function(e) {
        $("#create-org-form").submit();
    });
}
