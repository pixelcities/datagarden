import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { Organisation } from 'types'

const organisationsAdapter = createEntityAdapter<Organisation>()
const initialState = organisationsAdapter.getInitialState()
const dummyState = organisationsAdapter.upsertMany(initialState, [
  {
    id: "org_a",
    name: "Example Org A",
    color: "#00B7BE"
  },
  {
    id: "org_b",
    name: "Example Org B",
    color: "#F39D01"
  }
])


// reducers
const organisationsSlice = createSlice({
  name: 'organisations',
  initialState: dummyState,
  reducers: {
    addOrganisation: organisationsAdapter.addOne
  }
})

export default organisationsSlice.reducer


// actions
export const {
  addOrganisation
} = organisationsSlice.actions



// selectors
export const {
  selectAll: selectOrganisations,
  selectById: selectOrganisationById
} = organisationsAdapter.getSelectors<RootState>(state => state.organisations)

