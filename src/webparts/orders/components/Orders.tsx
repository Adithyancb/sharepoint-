import * as React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sp } from "@pnp/sp/presets/all";
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import styles from './Orders.module.scss';
import { IOrdersProps } from './IOrdersProps';

interface Customer {
  cName: string;
  cId: number;
}
interface Product {
  pName: string;
  pId: number;
  pType: string;
  pExpiry: string;
  pUnitValue: number;
}

interface StateType {
  customers: Customer[];
  products: Product[];
  customerId: number;
  productId: number;
  selectedCustomer: string;
  selectedProduct: string;
  productType: string;
  productExpiry: string;
  productUnitValue: number;
  numberOfUnits: number;
  // saleValue: number;
}

export default class Orders extends React.Component<IOrdersProps, {}> {

  state: StateType = {
    customers: [],
    products: [],
    customerId: 0,
    productId: 0,
    selectedCustomer: '',
    selectedProduct: '',
    productType: '',
    productExpiry: '',
    productUnitValue: 0,
    numberOfUnits: 0,
    // saleValue: null,
  };

  componentDidMount(): void {
    this.fetchCustomerData();
    this.fetchProductData();
  }

  private fetchCustomerData = async (): Promise<void> => {
    try {
      const response = await sp.web.lists.getByTitle('Customers').items.select('Customer_x0020_ID', 'Title').getAll();
      const customers = response.map((item) => ({
        cName: item.Title,
        cId: item.Customer_x0020_ID,
      }));
      this.setState({ customers });
    } catch (error) {
      console.log('Error fetching customer data:', error);
    }
  }

  private fetchProductData = async (): Promise<void> => {
    try {
      const response = await sp.web.lists.getByTitle('Products').items.select('Product_x0020_ID', 'Title', 'Product_x0020_Type', 'Product_x0020_Expiry_x0020_Date', 'Product_x0020_Unit_x0020_Price').getAll();
      const products = response.map((item) => ({
        pName: item.Title,
        pId: item.Product_x0020_ID,
        pType: item.Product_x0020_Type,
        pExpiry: item.Product_x0020_Expiry_x0020_Date,
        pUnitValue: item.Product_x0020_Unit_x0020_Price,
      }));
      this.setState({ products });
    } catch (error) {
      console.log('Error fetching product data:', error);
    }
  }

  private handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      const selectedCustomerName = e.target.value;
      const selectedCustomer = this.state.customers.find(
        (customer: Customer) => customer.cName === selectedCustomerName
      );
      if (selectedCustomer) {
        this.setState({
          selectedCustomer: selectedCustomerName,
          customerId: selectedCustomer.cId,
        });
      }
    } catch (error) {
      console.log('Error while loading customer data:', error);
    }
  }

  private handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      const selectedProductId = e.target.value;
      const selectedProduct = this.state.products.find(
        (product: Product) => product.pName === selectedProductId
      );
      if (selectedProduct) {
        this.setState({
          selectedProduct: selectedProductId,
          productId: selectedProduct.pId,
          productType: selectedProduct.pType,
          productExpiry: selectedProduct.pExpiry,
          productUnitValue: selectedProduct.pUnitValue,
        });
      }
    } catch (error) {
      console.log('Error while loading product data:', error);
    }
  }

  // calculateSaleValue = (e) => {
  //   try {
  //     this.setState({
  //       numberOfUnits: e.target.value
  //       saleValue: productUnitValue * numberOfUnits,
  //     });
  //   } catch (error) {
  //     console.log('Error while calculating sale value:', error);
  //   }
  // }

  private generateOrderID = (): string => {
    const id = uuidv4();
    const alphanumericID = id.replace(/-/g, '').slice(0, 3);
    return alphanumericID;
  }

  private createOrder = async (): Promise<void> => {
    const { customerId, productId, productUnitValue, numberOfUnits } = this.state;
    try {
      if (customerId > 0 && productId > 0 && productUnitValue > 0 && numberOfUnits > 0) {
        const uniqueId = this.generateOrderID();
        await sp.web.lists.getByTitle("Orders").items.add({
          'Title': uniqueId,
          'Customer_x0020_ID': customerId,
          'Product_x0020_ID': productId,
          'Units_x0020_Sold': numberOfUnits,
          'Unit_x0020_Price': productUnitValue,
          'Sale_x0020_Value': numberOfUnits * productUnitValue,
        });
        alert(`Order created successfully with ID: ${uniqueId}`);
        this.resetForm();
      } else {
        alert('Please make sure that you have filled all required fields before adding the order. (Minimum number of units : 1)');
      }
    }
    catch (error) {
      console.log('Error while creating order:', error);
    }
  }

  private editOrder = async (): Promise<void> => {
    try {
      const id = prompt("Enter the Order ID to edit");
      if (id) {
        const items = await sp.web.lists.getByTitle("Orders").items.filter(`Title eq '${id}'`).top(1).get();
        if (items.length > 0) {
          const selectedOrder = items[0];
          const customerId = selectedOrder.Customer_x0020_ID;
          const productId = selectedOrder.Product_x0020_ID;
          const numberOfUnits = selectedOrder.Units_x0020_Sold;

          const customer = await sp.web.lists.getByTitle("Customers").items.filter(`Customer_x0020_ID eq '${customerId}'`).top(1).get();
          const product = await sp.web.lists.getByTitle("Products").items.filter(`Product_x0020_ID eq '${productId}'`).top(1).get();

          if (customer.length > 0 && product.length > 0) {
            const selectedCustomer = customer[0].Title;
            const selectedProduct = product[0].Title;
            const productType = product[0].Product_x0020_Type;
            const productExpiry = product[0].Product_x0020_Expiry_x0020_Date;
            const productUnitValue = product[0].Product_x0020_Unit_x0020_Price;

            this.setState({
              customerId,
              productId,
              selectedCustomer,
              selectedProduct,
              productType,
              productExpiry,
              productUnitValue,
              numberOfUnits,
            });

            const saveButton = document.createElement("button");
            saveButton.className = styles.label;
            saveButton.innerText = "Save Changes";
            saveButton.addEventListener("click", () => this.saveChanges(id));
            const buttonSection = document.querySelector(`.${styles.buttonSection}`);
            buttonSection.appendChild(saveButton);

            const removeSaveButton = () => {
              saveButton.removeEventListener("click", removeSaveButton);
              saveButton.remove();
            };

            saveButton.addEventListener("click", removeSaveButton);
          } else {
            alert(`Order ID: ${id} not found.`);
          }
        } else {
          alert(`Please enter a valid Order ID.`);
        }
      }
    } catch (error) {
      console.log('Error while editing order:', error);
    }
  }

  private saveChanges = async (orderId: string): Promise<void> => {
    const { customerId, productId, productUnitValue, numberOfUnits } = this.state;
    try {
      if (customerId > 0 && productId > 0 && productUnitValue > 0 && numberOfUnits > 0) {
        const updateItem = await sp.web.lists.getByTitle("Orders").items.filter(`Title eq '${orderId}'`).top(1).get();
        if (updateItem.length > 0) {
          await sp.web.lists.getByTitle("Orders").items.getById(updateItem[0].Id).update({
            'Customer_x0020_ID': customerId,
            'Product_x0020_ID': productId,
            'Units_x0020_Sold': numberOfUnits,
            'Unit_x0020_Price': productUnitValue,
            'Sale_x0020_Value': numberOfUnits * productUnitValue,
          });
          alert(`Order ID: ${orderId} updated successfully!`);
          this.resetForm();
        } else {
          alert('Please enter a valid Order Id.');
        }
      } else {
        alert('Please make sure that you have filled all required fields before updating the order. (Minimum number of units: 1)');
      }
    } catch (error) {
      console.log('Error while updating order:', error);
    }
  }


  private deleteOrder = async (): Promise<void> => {
    try {
      const id = prompt("Enter the Order ID to delete");
      if (id) {
        const deleteItem = await sp.web.lists.getByTitle("Orders").items.filter(`Title eq '${id}'`).top(1).get();
        if (deleteItem.length > 0) {
          await sp.web.lists.getByTitle("Orders").items.getById(deleteItem[0].Id).delete();
          alert(`Order ID: ${id} deleted successfully!`);
        } else {
          alert(`Order ID: ${id} not found.`);
        }
      } else {
        alert(`Please enter a valid Order ID.`);
      }
    } catch (error) {
      console.log('Error while deleting order:', error);
    }
  }


  private resetForm = (): void => {
    this.setState({
      customerId: 0,
      productId: 0,
      selectedCustomer: '',
      selectedProduct: '',
      productType: '',
      productExpiry: '',
      productUnitValue: 0,
      numberOfUnits: 0,
      // saleValue: 0,
    });
  }

  public render(): React.ReactElement<IOrdersProps> {
    const { customers, products, selectedCustomer, selectedProduct, productType, productExpiry, productUnitValue, numberOfUnits } = this.state;

    return (
      <div className={styles.orderscss}>
        <div className={styles.container}>
          <div className={styles.row}>
            <div className={styles.column}>
              <table className={styles.table}>
                <tbody>
                  <tr>
                    <td className={styles.fieldLabel}>Customer Name
                    <span className={styles.requiredIndicator}>*</span> </td>
                    <td>
                      <select className={styles.inputField} value={selectedCustomer} onChange={this.handleCustomerChange} required>
                        <option value="" disabled>Select customer</option>
                        {customers.map((customer) => (
                          <option key={customer.cName} value={customer.cName}>
                            {customer.cName}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.fieldLabel}>Product Name
                    <span className={styles.requiredIndicator}>*</span> </td>
                    <td>
                      <select className={styles.inputField} value={selectedProduct} onChange={this.handleProductChange} required>
                        <option value="" disabled>Select product</option>
                        {products.map((product) => (
                          <option key={product.pName} value={product.pName}>
                            {product.pName}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.fieldLabel}>Product Type</td>
                    <td>
                      <input type="text" className={styles.inputField} value={productType} readOnly />
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.fieldLabel}>Product Expiry</td>
                    <td>
                      <input type="text" className={styles.inputField} value={productExpiry} readOnly />
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.fieldLabel}>Product Unit Value</td>
                    <td>
                      <input type="text" className={styles.inputField} value={productUnitValue} readOnly />
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.fieldLabel}>Number of Units
                    <span className={styles.requiredIndicator}>*</span></td>
                    <td>
                      <input type="text" className={styles.inputField} value={numberOfUnits} onChange={(e) => this.setState({ numberOfUnits: e.target.value })} />
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.fieldLabel}>Sale Value</td>
                    <td>
                      <input type="text" className={styles.inputField} value={numberOfUnits * productUnitValue} readOnly />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className={styles.buttonSection}>
                <div className={styles.button}>
                  <button className={styles.label} onClick={this.createOrder}>Add</button>
                </div>
                <div className={styles.button}>
                  <button className={styles.label} onClick={this.editOrder}>Edit</button>
                </div>
                <div className={styles.button}>
                  <button className={styles.label} onClick={this.deleteOrder}>Delete</button>
                </div>
                <div className={styles.button}>
                  <button className={styles.label} onClick={this.resetForm}>Reset</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}