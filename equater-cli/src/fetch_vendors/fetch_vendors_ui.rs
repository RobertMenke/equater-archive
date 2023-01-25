use cli_table::{print_stdout, Cell, CellStruct, Style, Table};

use crate::vendor::Vendor;
use std::io::Result;

pub struct FetchVendorsUi {
    items: Vec<Vendor>,
}

impl FetchVendorsUi {
    pub fn new(vendors: Vec<Vendor>) -> FetchVendorsUi {
        Self { items: vendors }
    }

    pub fn render(&self) -> Result<()> {
        let data: Vec<Vec<CellStruct>> = self
            .items
            .iter()
            .map(|vendor| self.vendor_to_cell(vendor))
            .collect();

        let table = data
            .table()
            .title(vec![
                "ID".cell().bold(true),
                "Name".cell().bold(true),
                "UUID".cell().bold(true),
                "Has Been Reviewed".cell().bold(true),
                "Identity Can't Be Determined".cell().bold(true),
            ])
            .bold(true);

        print_stdout(table)
    }

    fn vendor_to_cell(&self, vendor: &Vendor) -> Vec<CellStruct> {
        vec![
            vendor.id.to_string().cell(),
            vendor.friendly_name.clone().cell(),
            vendor.uuid.clone().cell(),
            vendor.has_been_reviewed_internally.cell(),
            vendor.vendor_identity_cannot_be_determined.cell(),
        ]
    }
}
