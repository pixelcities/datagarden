# Sources

Data Sources are the entrypoint into the use of DataGarden. The purpose of a **Source** is to make your data available
to the platform, with as little hurdles as possible. All sources are by default private, and only you, as the uploader,
will have access to source and the columns.

## Actions
Sources show a preview of the data, and they cannot be edited on their own. The following actions are possible:
- Updating title
- Granting access
- Changing *column* shares
- Publishing
- Deleting

### Title
Users that have access to source (see: [granting access](#granting-access)) can change the title. This merely updates
the metadata for the table, and won't require any updates to the data.

> **Note**: Column attribute names are linked to "Concepts", and can be edited in the [Taxonomy](../taxonomy.md) overview

### Granting access
To control access to the source, you can invite other collaborators. Inviting a collaborator will grant them access to
the metadata of the source, and allows them to execute all of the actions mentioned in this chapter, with the exception
of changing *column* shares.

> **Warning**: It is not currently possible to remove collaborators from a source. Keep an eye on our roadmap to see when this
> feature becomes available.

### Changing *column* shares
Granting access to a column will share the underlying encryption key. This means it is impossible to gain access to the
data of a column other than by one of your collaborators with access to the key sharing it with you.

> **Warning**: While you can unshare a column again, it will not rotate the encryption keys. Keep an eye on our roadmap to
> see when this feature becomes available.

### Publishing
By publishing a source, it becomes available for use in the workflow builder. It does not become available to more users
than it was already shared with, meaning that only those users can see it pop up in the workflow builder.

You can unpublish a source at anytime, but this merely removes it from the sources tab in the workflow builder. Any
sources that have already been used will continue to exist on the canvas.

### Deleting
By deleting the source, the source metadata is immediatly deleted. The data itself is marked for deletion, and will be
purged after a fixed number of days to allow a manual rollback in case the deletion happened by mistake. The encryption
keys will be deleted from everyones vault after the same interval (note that this is just to cleanup stale data: data keys
are never reused and are useless after the encrypted data is gone).

Deleting a source is only possible when the source is not used in any workflows. If it is used in a workflow, it should
be deleted beforehand. This is done to make sure that the source is not persisted by accident through a copy in the
workflow builder, while the intend was for it to be fully deleted.

