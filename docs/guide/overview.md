# Overview

The anatomy of a data space roughly consists of the following components:
- a place to upload and manage data [**sources**](#sources),
- the [**workflow builder**](#workflow-builder) to wrangle and analyse these sources,
- and a [**reports**](#reports) builder to disseminate and share results.

In DataGarden, the sidebar on the left contains links to these components. We will only handle a subset to get going,
for more information on the other components you can consult the reference manual.

## Sources
To get started, some data will have to be uploaded to the data space. One of the core principles of DataGarden is **data
reproducibility**. This means that all operations that are done on data must be persisted somewhere: a quick edit here
and there are disastrous in the long run, because the information and knowledge on what was there originally is lost.
This is why we encourage that data is uploaded as close to its original state as possible, without any filtering or
editing beforehand.

Uploading your source data without filtering out sensitive information is not desirable for most online applications,
but in DataGarden all data is **end-to-end encrypted**, and your source data never leaves your device unencrypted. On
top of that, the dataset is not shared with your data space members by default either.

> When you upload a dataset, each column is encrypted with its own seperate key. Only when you share a column with a
> collaborator will they gain access to the key. The server never sees any of the keys. Learn more about data encryption
> [here](../encryption.md).

Once you have uploaded a dataset, you will be greeted by a preview of your data. Note the use of the word *preview*: you
will not be able to click on a cell and manually edit the data value. This would, once more, violate the principle of
data reproducibility. Instead, your data source can be published, enabling its use in the workflow builder.

![x](../images/source.png)
*Img 1: Source table preview*

Before we move on to the workflow builder, a quick note on access controls. By default, the source is only available to
yourself. You can choose to grant access and share certain columns to other collaborators. First, you should invite them
to the source as a whole, enabling them to even see the existence of this source, by typing their name or email in the
dropdown on the right called *explicit shares*. Once they are part of the source dataset, you can give them access to
individual columns by clicking on a column header, and dragging them to *full access*.

Once shared, everyone that has access to a column retains this access even when new datasets are created from this
source. But we are getting ahead of ourselves, let's first build a simple workflow.

## Workflow builder

## Reports

