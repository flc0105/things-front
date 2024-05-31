<template>
  <div>
    <el-button type="primary" @click="showAddDialog">Add Item</el-button>
    <el-button @click="getItems">Refresh</el-button>
    <el-table :data="items" style="width: 100%">
      <el-table-column label="#">
        <template #default="{ $index }">
          {{ $index + 1 }}
        </template>
      </el-table-column>


      <!-- <el-table-column prop="name" label="Name" title="name"></el-table-column> -->

      <el-table-column prop="name" label="Name" title="name">
      <template #default="scope">
        <el-popover effect="light" trigger="hover" placement="top" width="auto" :title="scope.row.name" :content="scope.row.remark" v-if="scope.row.remark!=null">
          <!-- <template #default>
            <div>{{ scope.row.name }}</div>
          </template> -->
          <template #reference>
            {{scope.row.name}}
          </template>
        </el-popover>
      </template>
    </el-table-column>


      <el-table-column prop="price" label="Price"></el-table-column>
      <el-table-column
        prop="purchaseDate"
        label="Purchase Date"
      ></el-table-column>
      <el-table-column
        prop="ownershipDuration"
        label="Ownership Duration"
      ></el-table-column>

      <el-table-column fixed="right" label="Operations" width="120">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="editItem(row)"
            >Edit</el-button
          >

          <el-popconfirm title="确定要删除吗？" @confirm="deleteItem(row.id)">
            <template #reference>
              <el-button link type="primary" size="small">Delete</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editMode ? 'Edit Item' : 'Add Item'"
    >
      <el-form :model="newItem" ref="newItemForm" label-width="120px">
        <el-form-item label="Name" prop="name">
          <el-input v-model="newItem.name"></el-input>
        </el-form-item>
        <el-form-item label="Price" prop="price">
          <el-input v-model="newItem.price"></el-input>
        </el-form-item>
        <el-form-item label="Purchase Date" prop="purchaseDate">
          <el-date-picker
            v-model="newItem.purchaseDate"
            type="date"
            placeholder="Select Date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          ></el-date-picker>
        </el-form-item>

        <el-form-item label="Remark" prop="remark">
          <el-input
            v-model="newItem.remark"
            style="width: 500px"
            :rows="3"
            type="textarea"
            placeholder=""
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button
            type="primary"
            @click="editMode ? updateItem() : addItem()"
          >
            {{ editMode ? "Update" : "Add" }}
          </el-button>
        </span>
      </template>

      <!-- <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="addItem">Add</el-button>
      </div> -->
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from "vue";
import axios from "axios";

const items = ref([]);
const dialogVisible = ref(false);
const newItem = reactive({
  id: "",
  name: "",
  price: "",
  purchaseDate: "",
  remark: "",
});

const editMode = ref(false);

const getItems = async () => {
  try {
    const response = await axios.get("/api/items");
    items.value = response.data;
  } catch (error) {
    console.error("Error fetching items:", error);
  }
};

const showAddDialog = () => {
  newItem.id = "";
  newItem.name = "";
  newItem.price = "";
  newItem.purchaseDate = "";
  newItem.remark = "";
  editMode.value = false;
  dialogVisible.value = true;
};

const addItem = async () => {
  try {
    const response = await axios.post("/api/items", newItem);
    items.value.push(response.data);
    dialogVisible.value = false;
    this.$refs.newItemForm.resetFields(); // Reset form fields after adding
  } catch (error) {
    console.error("Error adding item:", error);
  }
};

const editItem = (item) => {
  newItem.name = item.name;
  newItem.id = item.id;
  newItem.price = item.price;
  newItem.purchaseDate = item.purchaseDate;
  newItem.remark = item.remark;

  editMode.value = true;

  dialogVisible.value = true;
};

onMounted(() => {
  getItems();
});

const updateItem = async () => {
  try {
    await axios.put(`/api/items/${newItem.id}`, newItem);
    const index = items.value.findIndex((item) => item.id === newItem.id);
    if (index !== -1) {
      items.value.splice(index, 1, newItem);
    }
    dialogVisible.value = false;
  } catch (error) {
    console.error("Error updating item:", error);
  }
};

const deleteItem = async (id) => {
  try {
    await axios.delete(`/api/items/${id}`);
    items.value = items.value.filter((item) => item.id !== id);
  } catch (error) {
    console.error("Error deleting item:", error);
  }
};
</script>

<style>
/* Add your custom styles here */
</style>
