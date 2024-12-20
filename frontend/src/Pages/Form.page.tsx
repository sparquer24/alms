import MultiStepForm from '../components/MultiStepForm';
import Header from '../components/Header';

const FormPage = () => {
    return (
        <>
        <Header title="Multi-Step Form" subtitle="Fill out the form below to complete the process." buttonLabel="Submit" />
        <MultiStepForm />
        </>
    );
};

export default FormPage;