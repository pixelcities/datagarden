# Taxonomy
The taxonomy overview lists all the "concepts" that are used in your data space, and allows you to edit some of their
properties or to link them together.

A **concept** represents the real world idea or meaning of your data. This is inspired by the widely used knowledge
vocabulary [SKOS](https://www.w3.org/TR/skos-primer/#secconcept), and this term is used by DataGarden to help link data
attributes across your data space.

## Why
When collaborating with other organisations, you often want to join (some of) your data to theirs. However, this is a
fundamentally difficult task due to different interpretations and implementations of real world concepts that are
modelled in your data. A simple example: a dataset containing surveyed income data, could either be net or
gross income.

By describing and thinking about the concepts used in your data space, you and your collaborators can start building a
simple but very specialized knowledge graph for the data within your data space. This will help joining datasets together
in a precise and correct manner, and allows you to enforce quality by adding restrictions to certain concepts (e.g.
income must always be positive).

## Changing concepts
Once a column attribute is linked to a concept, the concept will travel along any downstream workflows. If at any point
the concept no longer applies due to a change in the data, a new column with a new concept must be created so that the
data can be moved there. The same applies for changing data types, although this process is simplified using the
*attribute transformer*.

In general, you must try to not change concepts. You can of course improve them to better represent the real world, but
suddenly changing the meaning from, for example, gross to net income data is bad practice because the concept could
already be in use by another collaborator where they are relying on the previous meaning. When in doubt, it's better to
create a new, more precise, concept.

