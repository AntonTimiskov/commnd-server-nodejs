[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint")

function DeleteAllDocLibs( $url ) {
  $site = New-Object Microsoft.SharePoint.SPSite( $url );
  $web = $site.OpenWeb();
  $allLibs = New-Object System.Collections.ArrayList;
  foreach($lib in $web.Folders) {
    $allLibs.Add($lib.Url);
  }
  foreach($url in $allLibs) {
    $web.Folders.Delete($url);
  }
  $web.Dispose();
  $site.Dispose();
}

function DeleteAllLists( $url ) {

  $site = New-Object Microsoft.SharePoint.SPSite( $url );
  $web = $site.OpenWeb();
  $allLists = New-Object System.Collections.ArrayList;
  foreach($list in $web.Lists) {
    $allLists.Add($list.ID);
  }
  foreach($id in $allLists) {
    $web.Lists.Delete([System.Guid]$id);
  }
  $web.Dispose();
  $site.Dispose();
}

function NewSPSiteCollection( $url, $owner, $title ) {
  $webApp = [Microsoft.SharePoint.Administration.SPWebApplication]::Lookup( $url );
  $webApp.Sites.Add( $url , $title , "", 1033, "STS#0", $owner , "", "") | Out-Null
}

function NewSPWebAppByVer( $port, $owner, $password, $ver, $dbname ) { 
  $farm = [microsoft.sharepoint.administration.spfarm]::local;
  $builder = new-object microsoft.sharepoint.administration.SPWebApplicationBuilder($farm);
  $builder.Port = $port;
  $builder.ApplicationPoolId = [string]::join('', ("SharePoint - ", $port));
  $builder.CreateNewDatabase = $true;
  if ( $dbname -eq "" ) {  $builder.DatabaseName = [string]::join('', ("WSS_Content_", $port)); } else { $builder.DatabaseName = $dbname; }
  $builder.UseNTLMExclusively = $true;
  $builder.AllowAnonymousAccess = $false;
  $builder.UseSecureSocketsLayer = $false;
  if("{ver}" -eq "2010") {
    $password = ConvertTo-securestring $password -asplaintext -force
    $builder.ApplicationPoolUsername = $owner;
    $builder.ApplicationPoolPassword = $password;
    $builder.IdentityType = [Microsoft.SharePoint.Administration.IdentityType]::SpecificUser;
  }

  $webApp = $builder.Create();
  $webApp.Name = [string]::join('', ("WebApp - ",$port));
  $webApp.Update();
  $webApp.Provision();
  if( $ver -eq "2007") {
    $webApp.ApplicationPool.CurrentIdentityType = [Microsoft.SharePoint.Administration.IdentityType]::SpecificUser;
    $webApp.ApplicationPool.Username = $owner;
    $webApp.ApplicationPool.Password = $password;
    $webApp.Provision();
  }
}

function NewRootSPTLS( $url, $owner ) {
  $webApp = [Microsoft.SharePoint.Administration.SPWebApplication]::Lookup( $url );
  $tls = $webApp.Sites.Add("", $owner, "");
  $webApp.Update();
  $tls.Dispose();
}
   
