<#import "template.ftl" as layout>

<@layout.registrationLayout displayMessage=false; section>

    <#if section = "header">
        ${msg("termsTitle")}
    <#elseif section = "form">
        ${msg("termsText")?no_esc}

        <form class="form-actions" action="${url.loginAction}" method="POST">
            <input class="btn btn-primary btn-block btn-lg"
                   name="accept"
                   id="kc-accept"
                   type="submit"
                   value="${msg("doAccept")}"/>
        </form>
    </#if>

</@layout.registrationLayout>