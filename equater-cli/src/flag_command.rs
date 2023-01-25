pub struct FlagCommand {
    pub flag: Option<String>,
    pub value: Option<String>,
}

impl FlagCommand {
    pub fn new_from_clone(flag: Option<&String>, value: Option<&String>) -> Self {
        Self {
            flag: flag.cloned(),
            value: value.cloned(),
        }
    }

    pub fn has_flag(&self) -> bool {
        match &self.flag {
            Some(flag) => !flag.is_empty(),
            None => false,
        }
    }

    pub fn has_value(&self) -> bool {
        match &self.value {
            Some(value) => !value.is_empty(),
            None => false,
        }
    }

    pub fn flag_is(&self, value: &str) -> bool {
        match &self.flag {
            Some(flag) => flag.eq(value),
            None => false,
        }
    }

    pub fn flag_or<T>(&self, or: T) -> Result<String, T> {
        match &self.flag {
            Some(flag) => Ok(flag.clone()),
            None => Err(or),
        }
    }

    pub fn value_or<T>(&self, or: T) -> Result<String, T> {
        match &self.value {
            Some(value) => Ok(value.clone()),
            None => Err(or),
        }
    }
}
