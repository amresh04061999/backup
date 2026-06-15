
console.log('hello')
$(document).ready(function () {

    $("form").submit(async function (e) {

        e.preventDefault();

        // Remove old message safely
        $(".custom-message").remove();

        let email = $("#emailaddress1").val();

        if (!email) {
            return;
        }

        try {

            let response = await fetch(
                "/_api/contacts?$select=emailaddress1&$filter=emailaddress1 eq '" + email + "'",
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            let result = await response.json();

            if (result.value && result.value.length > 0) {

                // Email exists
                alert("Please check your email to reset your password.");

                $("form")[0].submit();

            } else {

                // Email not found
                $("#emailaddress1").after(
                    '<div class="custom-message text-danger mt-2">' +
                    'Email not found in system.' +
                    '</div>'
                );
            }

        } catch (error) {

            console.log(error);

            $("#emailaddress1").after(
                '<div class="custom-message text-danger mt-2">' +
                'Something went wrong.' +
                '</div>'
            );
        }

    });

});