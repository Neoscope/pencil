<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
    xmlns:p="http://www.evolus.vn/Namespace/Pencil"
    xmlns:html="http://www.w3.org/1999/xhtml"
    xmlns="http://www.w3.org/1999/xhtml">
<xsl:output method="html" encoding="utf-8"/>

    <xsl:template match="/">
        <html>
            <head>
                <title>
                    <xsl:value-of select="/p:Document/p:Properties/p:Property[@name='fileName']/text()"/>
                </title>
                <link rel="stylesheet" type="text/css" href="Resources/MultiLayer.css" />
                <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
                <script src="Resources/MultiLayer.js" />
            </head>
            <body>
                <main>
                    <section id="DocumentInformation">
                        <h1 id="documentTitle"><xsl:value-of select="/p:Document/p:Properties/p:Property[@name='friendlyName']/text()"/></h1>
                        <p id="documentMetadata">Exported at: <xsl:value-of select="/p:Document/p:Properties/p:Property[@name='exportTime']/text()"/></p>
                    </section>
                    <section id="Pages">
                        <xsl:apply-templates select="/p:Document/p:Pages/p:Page" />
                    </section>
                </main>
                <footer>
                    <b><xsl:value-of select="/p:Document/p:Properties/p:Property[@name='fileName']/text()"/></b> <i>- <xsl:value-of select="/p:Document/p:Properties/p:Property[@name='exportTime']/text()"/></i>
                </footer>
            </body>
        </html>
    </xsl:template>
    <xsl:template match="p:Page">
        <article class="Page" id="{p:Properties/p:Property[@name='fid']/text()}_page">

            <div class="ImageContainer">
                <img src="{@rasterized}"
                    width="{p:Properties/p:Property[@name='width']/text()}"
                    height="{p:Properties/p:Property[@name='height']/text()}"
                    usemap="#map_{p:Properties/p:Property[@name='fid']/text()}"/>
            </div>
            <details>
              <summary><xsl:value-of select="p:Properties/p:Property[@name='name']/text()"/></summary>
              <xsl:if test="p:Note">
                  <p class="Notes">
                      <xsl:apply-templates select="p:Note/node()" mode="processing-notes"/>
                  </p>
              </xsl:if>
            </details>
            <map name="map_{p:Properties/p:Property[@name='fid']/text()}">
                <xsl:apply-templates select="p:Links/p:Link" />
            </map>
        </article>
    </xsl:template>
    <xsl:template match="p:Link">
        <area class="PageLink" data-targetpage="{@targetFid}_page" data-targetFid="{@targetFid}" data-targetName="{@targetName}" shape="rect"
            coords="{@x},{@y},{@x+@w},{@y+@h}" title="Go to page '{@targetName}'"/>
    </xsl:template>

    <xsl:template match="html:*" mode="processing-notes">
        <xsl:copy>
            <xsl:copy-of select="@*[local-name() != '_moz_dirty']"/>
            <xsl:apply-templates mode="processing-notes"/>
        </xsl:copy>
    </xsl:template>
    <xsl:template match="html:a[@page-fid]" mode="processing-notes">
        <a href="#{@page-fid}_page" title="Go to page '{@page-name}'">
            <xsl:copy-of select="@class|@style"/>
            <xsl:apply-templates mode="processing-notes"/>
        </a>
    </xsl:template>
</xsl:stylesheet>
