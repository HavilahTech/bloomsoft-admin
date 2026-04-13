import DashboardLayout from "./DashboardMenu";

const withDashboardLayout = (WrappedComponent) => {
  return (props) => (
    <DashboardLayout>
      <WrappedComponent {...props} />
    </DashboardLayout>
  );
};

export default withDashboardLayout;
